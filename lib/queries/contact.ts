/**
 * contact_messages の admin 向けクエリ。
 *
 * - 全クエリで `.is('deleted_at', null)` 必須（CLAUDE.md 規約）。
 * - RLS は admin role のみ通すため、ユーザー画面側からは呼ばない。
 * - Server Action から呼ぶ前提なので Server Supabase クライアント (`@/lib/supabase/server`)
 *   を使う。
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  CONTACT_CATEGORIES,
  CONTACT_STATUSES,
  type ContactCategory,
  type ContactStatus,
} from '@/lib/contact/constants';

// Client Component からも import できるよう、enum 系の定数・型は
// `@/lib/contact/constants` に切り出し、ここで再 export する。
export { CONTACT_CATEGORIES, CONTACT_STATUSES };
export type { ContactCategory, ContactStatus };

export type ContactMessageListItem = {
  id: string;
  name: string;
  email: string;
  category: ContactCategory;
  status: ContactStatus;
  messagePreview: string;
  createdAt: string;
};

export type ContactMessageDetail = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  category: ContactCategory;
  status: ContactStatus;
  message: string;
  referenceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 管理画面一覧用。受信日時 DESC で 50 件まで取り（暫定。多くなったらページネーション）。
 * status 引数で絞り込み可能。
 */
export async function listContactMessages(filter?: {
  status?: ContactStatus;
}): Promise<ContactMessageListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from('contact_messages')
    .select('id, name, email, category, status, message, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('[contact] listContactMessages failed', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    category: row.category as ContactCategory,
    status: row.status as ContactStatus,
    messagePreview: row.message.slice(0, 80),
    createdAt: row.created_at,
  }));
}

/**
 * 管理画面詳細用。論理削除済みは notFound 扱い。
 */
export async function getContactMessageDetail(id: string): Promise<ContactMessageDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contact_messages')
    .select(
      'id, user_id, name, email, category, status, message, reference_url, created_at, updated_at',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.warn('[contact] getContactMessageDetail failed', error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    email: data.email,
    category: data.category as ContactCategory,
    status: data.status as ContactStatus,
    message: data.message,
    referenceUrl: data.reference_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export type ContactReply = {
  id: string;
  subject: string;
  body: string;
  sentAt: string;
  adminId: string | null;
};

/**
 * 指定のお問い合わせへの返信履歴を新しい順に返す（管理画面詳細用）。
 */
export async function listContactReplies(contactMessageId: string): Promise<ContactReply[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contact_replies')
    .select('id, subject, body, sent_at, admin_id')
    .eq('contact_message_id', contactMessageId)
    .is('deleted_at', null)
    .order('sent_at', { ascending: false });

  if (error) {
    console.warn('[contact] listContactReplies failed', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    body: row.body,
    sentAt: row.sent_at,
    adminId: row.admin_id,
  }));
}

/**
 * 指定 user_id（ログイン）or email（匿名）の **直近 24 時間** 送信数を返す。
 * レート制限判定（1 日 3 件まで）用。
 *
 * 匿名のメールベース制限は「メールアドレスを変えれば突破できる」ザル制限だが、
 * honeypot / NG ワード / 同意チェックと合わせれば MVP の現実的負荷では十分。
 * 厳格な anti-spam は Cloudflare Turnstile 等で別途検討する。
 */
export async function countRecentContactMessages(params: {
  userId?: string | null;
  email?: string | null;
}): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', since);

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  } else if (params.email) {
    query = query.is('user_id', null).eq('email', params.email);
  } else {
    return 0;
  }

  const { count, error } = await query;
  if (error) {
    console.warn('[contact] countRecentContactMessages failed', error);
    return 0;
  }
  return count ?? 0;
}
