'use server';

/**
 * 管理画面のお問い合わせ操作 Server Action。
 *
 * - status 切替（NEW → IN_PROGRESS → RESOLVED）
 * - 論理削除（deleted_at = now()）
 *
 * 認可:
 *   - `requireWriteAdmin()`: ゲスト管理者はここで弾かれる（GuestModeError を throw）。
 *   - ゲスト UI 側は `app/admin/layout.tsx` の `<fieldset disabled>` で実質的にクリック
 *     できない状態だが、cURL / DevTools 経由のリクエストもサーバ側で弾く。
 */

import { revalidatePath } from 'next/cache';
import { sendContactReply } from '@/lib/email/mailer';
import { createClient } from '@/lib/supabase/server';
import { requireWriteAdmin } from '@/lib/utils/requireAdmin';
import { CONTACT_STATUSES, type ContactStatus } from '@/lib/queries/contact';

export async function updateContactStatusAction(formData: FormData): Promise<void> {
  await requireWriteAdmin();

  const id = (formData.get('id') as string | null)?.trim();
  const statusRaw = (formData.get('status') as string | null) ?? '';
  if (!id || !isContactStatus(statusRaw)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('contact_messages')
    .update({ status: statusRaw })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    console.warn('[admin/contact] updateContactStatusAction failed', error);
    return;
  }

  revalidatePath('/admin/contact');
  revalidatePath(`/admin/contact/${id}`);
}

function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value);
}

const REPLY_SUBJECT_MAX = 200;
const REPLY_BODY_MAX = 5000;

export type ReplyActionState = {
  status: 'idle' | 'error' | 'success';
  formError?: string;
  fieldErrors?: { subject?: string; body?: string };
};

/**
 * 問い合わせユーザー宛に返信メールを送り、contact_replies に履歴を残す Server Action。
 *
 * 1. requireWriteAdmin: ゲスト管理者はここで弾く
 * 2. 入力バリデーション
 * 3. 対象 contact_messages を取得（email 宛先）
 * 4. SMTP 送信
 * 5. 成功時のみ contact_replies に INSERT
 * 6. contact_messages.status を NEW なら IN_PROGRESS に自動昇格（in_progress / resolved はそのまま）
 *
 * useActionState から呼ぶ前提なので (prev, formData) => state の形。
 */
export async function replyToContactAction(
  _prev: ReplyActionState,
  formData: FormData,
): Promise<ReplyActionState> {
  const admin = await requireWriteAdmin();

  const id = (formData.get('id') as string | null)?.trim();
  const subject = (formData.get('subject') as string | null)?.trim() ?? '';
  const body = (formData.get('body') as string | null)?.trim() ?? '';

  if (!id) return { status: 'error', formError: '対象のお問い合わせが特定できませんでした' };

  const fieldErrors: NonNullable<ReplyActionState['fieldErrors']> = {};
  if (!subject) fieldErrors.subject = '件名を入力してください';
  else if (subject.length > REPLY_SUBJECT_MAX)
    fieldErrors.subject = `件名は ${REPLY_SUBJECT_MAX} 文字以内で入力してください`;
  if (!body) fieldErrors.body = '本文を入力してください';
  else if (body.length > REPLY_BODY_MAX)
    fieldErrors.body = `本文は ${REPLY_BODY_MAX} 文字以内で入力してください`;
  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', fieldErrors };
  }

  const supabase = await createClient();
  const { data: target, error: fetchError } = await supabase
    .from('contact_messages')
    .select('id, email, status')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !target) {
    return { status: 'error', formError: 'お問い合わせが見つかりませんでした' };
  }

  // SMTP 送信。失敗時は DB を一切書き換えず、エラーで返す。
  const sendResult = await sendContactReply({
    to: target.email,
    subject,
    body,
  });
  if (!sendResult.ok) {
    return {
      status: 'error',
      formError:
        'メール送信に失敗しました（SMTP の env を確認してください）。返信履歴は保存されていません。',
    };
  }

  const { error: insertError } = await supabase.from('contact_replies').insert({
    contact_message_id: id,
    admin_id: admin.id,
    subject,
    body,
  });
  if (insertError) {
    // メールは送ったが履歴保存に失敗。整合性が崩れているので可視ログを残す。
    console.warn('[admin/contact] reply email sent but insert failed', insertError);
    return {
      status: 'error',
      formError:
        '返信メールは送信できましたが履歴の保存に失敗しました。同じ内容で再送しないでください。',
    };
  }

  // status を NEW → IN_PROGRESS に自動昇格（既に in_progress / resolved の場合は触らない）。
  if (target.status === 'NEW') {
    await supabase
      .from('contact_messages')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', id)
      .is('deleted_at', null);
  }

  revalidatePath('/admin/contact');
  revalidatePath(`/admin/contact/${id}`);
  return { status: 'success' };
}
