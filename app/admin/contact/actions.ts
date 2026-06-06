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

export async function softDeleteContactAction(formData: FormData): Promise<void> {
  await requireWriteAdmin();

  const id = (formData.get('id') as string | null)?.trim();
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('contact_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    console.warn('[admin/contact] softDeleteContactAction failed', error);
    return;
  }

  revalidatePath('/admin/contact');
}

function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value);
}
