'use server';

/**
 * お問い合わせフォーム送信 Server Action。
 *
 * 流れ:
 *   1. honeypot チェック（隠しフィールドに値が入っていれば静かに成功扱いで終了）
 *   2. 入力バリデーション
 *   3. NG ワードチェック（lib/ng-words.ts）
 *   4. レート制限チェック（user_id or email で 1 日 3 件まで）
 *   5. contact_messages に INSERT（Service Role 経由で RLS をバイパス）
 *   6. Gmail SMTP で運用宛通知メール送信（失敗しても成功表示は維持）
 *   7. /contact/thanks?id=<id> へ redirect
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { sendContactNotification } from '@/lib/email/mailer';
import { containsNgWord } from '@/lib/ng-words';
import {
  CONTACT_CATEGORIES,
  type ContactCategory,
  countRecentContactMessages,
} from '@/lib/queries/contact';
import { getCurrentUser } from '@/lib/supabase/get-user';

const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 80;
const MAX_REFERENCE_URL_LENGTH = 500;
const RATE_LIMIT_PER_DAY = 3;

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  INQUIRY: 'お問い合わせ',
  FEATURE_REQUEST: 'ご要望',
  BUG_REPORT: '不具合報告',
  OTHER: 'その他',
};

export type ContactFormState = {
  status: 'idle' | 'error';
  errors?: Record<string, string>;
  /** トースト風の汎用エラー（rate limit / NG ワード等） */
  formError?: string;
};

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // 1. honeypot: 隠しフィールド `website` に値が入っていれば bot 判定。
  //    エラーは返さず、表向きは成功してそのまま redirect する（bot に検知させない）。
  const honeypot = formData.get('website');
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    redirect('/contact/thanks');
  }

  // 2. バリデーション
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const categoryRaw = (formData.get('category') as string | null) ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';
  const referenceUrl = (formData.get('reference_url') as string | null)?.trim() || null;
  const consent = formData.get('consent');

  const errors: Record<string, string> = {};

  if (!name) errors.name = '名前を入力してください';
  else if (name.length > MAX_NAME_LENGTH)
    errors.name = `名前は ${MAX_NAME_LENGTH} 文字以内で入力してください`;

  if (!email) errors.email = 'メールアドレスを入力してください';
  else if (!isValidEmail(email)) errors.email = '正しいメールアドレスを入力してください';

  if (!isContactCategory(categoryRaw)) errors.category = 'カテゴリを選択してください';

  if (!message) errors.message = '本文を入力してください';
  else if (message.length < MIN_MESSAGE_LENGTH)
    errors.message = `本文は ${MIN_MESSAGE_LENGTH} 文字以上で入力してください`;
  else if (message.length > MAX_MESSAGE_LENGTH)
    errors.message = `本文は ${MAX_MESSAGE_LENGTH} 文字以内で入力してください`;

  if (
    referenceUrl &&
    (referenceUrl.length > MAX_REFERENCE_URL_LENGTH || !isValidUrl(referenceUrl))
  ) {
    errors.reference_url = '正しい URL を入力してください';
  }

  if (!consent) errors.consent = 'プライバシーポリシーへの同意が必要です';

  if (Object.keys(errors).length > 0) {
    return { status: 'error', errors };
  }

  const category = categoryRaw as ContactCategory;

  // 3. NG ワード（本文のみ）
  if (containsNgWord(message)) {
    return {
      status: 'error',
      formError: '不適切な表現が含まれている可能性があります。表現を見直してお試しください。',
    };
  }

  // 4. レート制限
  const user = await getCurrentUser();
  const recentCount = await countRecentContactMessages(user ? { userId: user.id } : { email });
  if (recentCount >= RATE_LIMIT_PER_DAY) {
    return {
      status: 'error',
      formError:
        '同じ送信者からの直近 24 時間のお問い合わせ上限に達しました。時間を置いて再度お試しください。',
    };
  }

  // 5. DB INSERT（Service Role 経由で RLS をバイパスする。
  //    INSERT ポリシーを置かない設計のため anon クライアントでは書けない）
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceUrl || !serviceRoleKey) {
    console.warn('[contact] Supabase env not set. Skipping insert.');
    return {
      status: 'error',
      formError: '送信に失敗しました。しばらくしてから再度お試しください。',
    };
  }
  const adminClient = createServiceClient(serviceUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: inserted, error: insertError } = await adminClient
    .from('contact_messages')
    .insert({
      user_id: user?.id ?? null,
      name,
      email,
      category,
      message,
      reference_url: referenceUrl,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.warn('[contact] insert failed', insertError);
    return {
      status: 'error',
      formError: '送信に失敗しました。しばらくしてから再度お試しください。',
    };
  }

  // 6. メール通知（失敗しても続行）
  await sendContactNotification({
    contactId: inserted.id,
    name,
    email,
    categoryLabel: CATEGORY_LABELS[category],
    message,
    referenceUrl,
  });

  // 7. redirect
  redirect(`/contact/thanks?id=${inserted.id}`);
}

function isContactCategory(value: string): value is ContactCategory {
  return (CONTACT_CATEGORIES as readonly string[]).includes(value);
}

function isValidEmail(value: string): boolean {
  // 厳密 RFC ではなくフォーム送信に十分な簡易判定。
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
