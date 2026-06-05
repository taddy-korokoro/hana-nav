'use server';

import { revalidatePath } from 'next/cache';
import { updateUserAdmin } from '@/lib/queries/admin-users';
import { requireWriteAdmin } from '@/lib/utils/requireAdmin';

/**
 * `/admin/users` 系で使う Server Actions。
 *
 * - ロール変更（user ⇄ admin）
 * - BAN（profiles.deleted_at を立てる） / BAN 解除
 *
 * 自分自身を降格・BAN する事故を防ぐため、`requireAdmin()` で得た UID と
 * 対象 UID が一致した場合はエラーコードを返す。
 */

export type UserActionState = { ok?: boolean; error?: string } | null;

export async function changeRoleAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const me = await requireWriteAdmin();
  const userId = String(formData.get('user_id') ?? '');
  const nextRole = String(formData.get('next_role') ?? '');

  if (!userId || (nextRole !== 'user' && nextRole !== 'admin')) {
    return { error: 'invalid_input' };
  }
  if (userId === me.id && nextRole !== 'admin') {
    return { error: 'cannot_self_modify' };
  }

  const result = await updateUserAdmin(userId, { role: nextRole });
  if (!result.ok) {
    return { error: result.error.code };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function setBanAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const me = await requireWriteAdmin();
  const userId = String(formData.get('user_id') ?? '');
  const ban = formData.get('ban') === 'true';

  if (!userId) {
    return { error: 'invalid_input' };
  }
  if (userId === me.id && ban) {
    return { error: 'cannot_self_modify' };
  }

  const result = await updateUserAdmin(userId, {
    deletedAt: ban ? new Date().toISOString() : null,
  });
  if (!result.ok) {
    return { error: result.error.code };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}
