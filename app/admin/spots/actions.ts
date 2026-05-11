'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createSpot,
  setSpotPublished,
  softDeleteSpot,
  updateSpot,
  type SpotFlowerInput,
  type SpotImageInput,
  type SpotMutationInput,
} from '@/lib/queries/admin-spot-mutations';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * `FormData` から `SpotMutationInput` を組み立てる共通パーサ。フォームは hidden 入力で
 * 画像 / 関連花の配列を JSON 化して投げる構成（`SpotEditor` 側で `JSON.stringify`）。
 */
function parseSpotForm(formData: FormData): SpotMutationInput {
  const num = (key: string): number => Number(formData.get(key));
  const str = (key: string): string => (formData.get(key) ?? '').toString();
  const optStr = (key: string): string | null => {
    const v = str(key).trim();
    return v.length > 0 ? v : null;
  };

  let images: SpotImageInput[] = [];
  let flowers: SpotFlowerInput[] = [];
  try {
    const imagesJson = str('images_json');
    if (imagesJson) images = JSON.parse(imagesJson) as SpotImageInput[];
  } catch (e) {
    console.error('[parseSpotForm] failed to parse images_json', e);
  }
  try {
    const flowersJson = str('flowers_json');
    if (flowersJson) flowers = JSON.parse(flowersJson) as SpotFlowerInput[];
  } catch (e) {
    console.error('[parseSpotForm] failed to parse flowers_json', e);
  }

  return {
    name: str('name'),
    nameKana: optStr('name_kana'),
    description: optStr('description'),
    prefectureId: num('prefecture_id'),
    location: str('location'),
    latitude: num('latitude'),
    longitude: num('longitude'),
    bestSeasonStart: num('best_season_start'),
    bestSeasonEnd: num('best_season_end'),
    officialUrl: optStr('official_url'),
    source: optStr('source'),
    accessInfo: optStr('access_info'),
    parkingInfo: optStr('parking_info'),
    entranceFee: optStr('entrance_fee'),
    isPublished: formData.get('is_published') === 'on' || formData.get('is_published') === 'true',
    images,
    flowers,
  };
}

export type FormActionState = { error?: string } | null;

export async function createSpotAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const input = parseSpotForm(formData);
  const result = await createSpot(input);
  if (!result.ok) {
    return { error: result.error.code };
  }
  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath('/spots');
  redirect(`/admin/spots/${result.id}`);
}

export async function updateSpotAction(
  spotId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();
  const input = parseSpotForm(formData);
  const result = await updateSpot(spotId, input);
  if (!result.ok) {
    return { error: result.error.code };
  }
  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath(`/admin/spots/${spotId}`);
  revalidatePath(`/spots/${spotId}`);
  revalidatePath('/spots');
  return { error: undefined };
}

export async function togglePublishedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('spot_id') ?? '');
  const next = formData.get('next') === 'true';
  if (!id) return;
  await setSpotPublished(id, next);
  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath(`/admin/spots/${id}`);
  revalidatePath(`/spots/${id}`);
  revalidatePath('/spots');
}

export async function softDeleteSpotAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('spot_id') ?? '');
  const redirectTo = String(formData.get('redirect_to') ?? '/admin/spots');
  if (!id) return;
  await softDeleteSpot(id);
  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath(`/spots/${id}`);
  revalidatePath('/spots');
  redirect(redirectTo);
}
