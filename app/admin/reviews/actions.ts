'use server';

import { revalidatePath } from 'next/cache';
import { restoreReviewAdmin, softDeleteReviewAdmin } from '@/lib/queries/admin-reviews';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * `/admin/reviews` の論理削除 / 復元 Server Actions。
 */

export type ReviewActionState = { ok?: boolean; error?: string } | null;

export async function softDeleteReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  await requireAdmin();
  const id = String(formData.get('review_id') ?? '');
  if (!id) return { error: 'invalid_input' };

  const result = await softDeleteReviewAdmin(id);
  if (!result.ok) return { error: result.error.code };

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  return { ok: true };
}

export async function restoreReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  await requireAdmin();
  const id = String(formData.get('review_id') ?? '');
  if (!id) return { error: 'invalid_input' };

  const result = await restoreReviewAdmin(id);
  if (!result.ok) return { error: result.error.code };

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  return { ok: true };
}
