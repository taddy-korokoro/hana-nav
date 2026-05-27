'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { CACHE_TAGS, flowerTag, spotTag } from '@/lib/cacheTags';
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
  // 公開ページの 'use cache' は cacheTag で invalidate する。管理画面は per-request
  // なので path-based でナビ表示の鮮度だけ揃える。
  if (row.owner_type === 'spot') {
    updateTag(spotTag(row.owner_id));
    updateTag(CACHE_TAGS.spots);
    revalidatePath(`/admin/spots/${row.owner_id}`);
  } else if (row.owner_type === 'flower') {
    updateTag(flowerTag(row.owner_id));
    updateTag(CACHE_TAGS.flowers);
    revalidatePath(`/admin/flowers/${row.owner_id}`);
  }
}
