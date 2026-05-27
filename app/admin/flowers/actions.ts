'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createFlower,
  softDeleteFlower,
  updateFlower,
  type FlowerAliasInput,
  type FlowerImageInput,
  type FlowerMutationError,
  type FlowerMutationInput,
} from '@/lib/queries/admin-flower-mutations';
import { CACHE_TAGS, flowerTag } from '@/lib/cacheTags';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * `FormData` から `FlowerMutationInput` を組み立てる共通パーサ。
 * 画像 / alias の配列は hidden の JSON で受け取る（`FlowerEditor` で `JSON.stringify`）。
 */
function parseFlowerForm(formData: FormData): FlowerMutationInput {
  const str = (key: string): string => (formData.get(key) ?? '').toString();
  const optStr = (key: string): string | null => {
    const v = str(key).trim();
    return v.length > 0 ? v : null;
  };
  const optInt = (key: string): number | null => {
    const v = str(key).trim();
    if (v.length === 0) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  let images: FlowerImageInput[] = [];
  let aliases: FlowerAliasInput[] = [];
  try {
    const json = str('images_json');
    if (json) images = JSON.parse(json) as FlowerImageInput[];
  } catch (e) {
    console.error('[parseFlowerForm] failed to parse images_json', e);
  }
  try {
    const json = str('aliases_json');
    if (json) aliases = JSON.parse(json) as FlowerAliasInput[];
  } catch (e) {
    console.error('[parseFlowerForm] failed to parse aliases_json', e);
  }

  return {
    name: str('name'),
    nameKana: optStr('name_kana'),
    description: optStr('description'),
    defaultSeasonStart: optInt('default_season_start'),
    defaultSeasonEnd: optInt('default_season_end'),
    images,
    aliases,
  };
}

export type FlowerFormActionState = {
  error?: string;
  errorDetail?: string;
} | null;

function toState(error: FlowerMutationError): FlowerFormActionState {
  return {
    error: error.code,
    errorDetail: 'message' in error ? error.message : undefined,
  };
}

function revalidateFlowerPaths(id?: string) {
  // 公開ページ側の 'use cache' ブロック（loadFlowerBundle / HomeContent / loadAreaBundle）
  // は cacheTag で invalidate する。これにより admin で花を編集した瞬間に
  // 公開ページの cacheLife を待たず最新値が反映される。
  // updateTag は Server Action 内専用で「次のリクエストで確実に新データを返す」
  // read-your-own-writes セマンティクスを持つ。revalidateTag（profile 必須・遅延）と
  // 異なり、admin が編集直後に画面を見たときに古いキャッシュが返らない。
  updateTag(CACHE_TAGS.flowers);
  if (id) updateTag(flowerTag(id));

  // 管理画面側は 'use cache' で囲まずに per-request 評価しているため、
  // path-based の revalidatePath で十分（マイページ等の Suspense 配下のサーバー再評価をトリガ）。
  revalidatePath('/admin');
  revalidatePath('/admin/flowers');
  if (id) revalidatePath(`/admin/flowers/${id}`);
}

export async function createFlowerAction(
  _prev: FlowerFormActionState,
  formData: FormData,
): Promise<FlowerFormActionState> {
  await requireAdmin();
  const input = parseFlowerForm(formData);
  const result = await createFlower(input);
  if (!result.ok) {
    return toState(result.error);
  }
  revalidateFlowerPaths(result.id);
  redirect(`/admin/flowers/${result.id}`);
}

export async function updateFlowerAction(
  flowerId: string,
  _prev: FlowerFormActionState,
  formData: FormData,
): Promise<FlowerFormActionState> {
  await requireAdmin();
  const input = parseFlowerForm(formData);
  const result = await updateFlower(flowerId, input);
  if (!result.ok) {
    return toState(result.error);
  }
  revalidateFlowerPaths(flowerId);
  return { error: undefined };
}

export async function softDeleteFlowerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('flower_id') ?? '');
  if (!id) return;
  const result = await softDeleteFlower(id);
  if (!result.ok) {
    console.error('[softDeleteFlowerAction] failed', result.error);
    return;
  }
  revalidateFlowerPaths(id);
  redirect('/admin/flowers');
}
