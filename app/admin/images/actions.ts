'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * `/admin/images` で個別画像を論理削除する Server Action。
 * 親（spot / flower）の編集画面と一覧画面を両方 revalidate する。
 */
export async function softDeleteImageAction(formData: FormData) {
  await requireAdmin();
  const imageId = String(formData.get('image_id') ?? '');
  if (!imageId) return;

  const admin = createAdminClient();
  const { data: row, error: lookupError } = await admin
    .from('images')
    .select('owner_type, owner_id')
    .eq('id', imageId)
    .is('deleted_at', null)
    .maybeSingle();
  if (lookupError || !row) {
    console.error('[softDeleteImageAction] image not found', { imageId, lookupError });
    return;
  }

  const { error } = await admin
    .from('images')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', imageId)
    .is('deleted_at', null);
  if (error) {
    console.error('[softDeleteImageAction] failed', error);
    return;
  }

  revalidatePath('/admin/images');
  if (row.owner_type === 'spot') {
    revalidatePath(`/admin/spots/${row.owner_id}`);
    revalidatePath(`/spots/${row.owner_id}`);
    revalidatePath('/spots');
  } else if (row.owner_type === 'flower') {
    revalidatePath(`/admin/flowers/${row.owner_id}`);
    revalidatePath(`/flowers/${row.owner_id}`);
    revalidatePath('/flowers');
  }
}
