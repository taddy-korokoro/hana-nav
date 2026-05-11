import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateImageOwner } from '@/lib/utils/imageValidator';

/**
 * 管理画面のスポット系 mutation 共通ロジック。Server Action / Route Handler どちらからも
 * 呼び出せるようにロジックをここに集約する。**呼び出し前に必ず `requireAdmin()` を通すこと。**
 *
 * RLS を完全にバイパスするため、`createAdminClient()` の Service Role を使う。
 * `spots` / `images` / `spot_flowers` への直接書き込みは admin 経路のみとする規約。
 */

export type SpotImageInput = {
  url: string;
  caption?: string | null;
  displayOrder: number;
};

export type SpotFlowerInput = {
  flowerId: string;
  bloomStartMonth: number | null;
  bloomEndMonth: number | null;
};

export type SpotMutationInput = {
  name: string;
  nameKana: string | null;
  description: string | null;
  prefectureId: number;
  location: string;
  latitude: number;
  longitude: number;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  officialUrl: string | null;
  source: string | null;
  accessInfo: string | null;
  parkingInfo: string | null;
  entranceFee: string | null;
  isPublished: boolean;
  images: SpotImageInput[];
  flowers: SpotFlowerInput[];
};

export type SpotMutationError =
  | { code: 'name_required' }
  | { code: 'prefecture_required' }
  | { code: 'location_required' }
  | { code: 'coordinates_required' }
  | { code: 'best_season_invalid' }
  | { code: 'source_required' }
  | { code: 'image_url_invalid' }
  | { code: 'flower_required' }
  | { code: 'bloom_month_invalid' }
  | { code: 'save_failed'; message?: string };

/**
 * `SpotMutationInput` を最低限の正当性チェックにかける。失敗時はエラーコードを返す。
 * 数値範囲・必須・依存関係（公式 URL 未登録 → source 必須）を一通り検証する。
 */
export function validateSpotInput(input: SpotMutationInput): SpotMutationError | null {
  if (!input.name.trim()) return { code: 'name_required' };
  if (!Number.isInteger(input.prefectureId) || input.prefectureId < 1 || input.prefectureId > 47)
    return { code: 'prefecture_required' };
  if (!input.location.trim()) return { code: 'location_required' };
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    Math.abs(input.latitude) > 90 ||
    Math.abs(input.longitude) > 180
  )
    return { code: 'coordinates_required' };
  if (
    !Number.isInteger(input.bestSeasonStart) ||
    !Number.isInteger(input.bestSeasonEnd) ||
    input.bestSeasonStart < 1 ||
    input.bestSeasonStart > 12 ||
    input.bestSeasonEnd < 1 ||
    input.bestSeasonEnd > 12
  )
    return { code: 'best_season_invalid' };
  if (!input.officialUrl && !input.source?.trim()) return { code: 'source_required' };
  for (const img of input.images) {
    if (!img.url.trim() || !/^https?:\/\//.test(img.url)) return { code: 'image_url_invalid' };
  }
  for (const f of input.flowers) {
    if (!f.flowerId) return { code: 'flower_required' };
    for (const m of [f.bloomStartMonth, f.bloomEndMonth]) {
      if (m == null) continue;
      if (!Number.isInteger(m) || m < 1 || m > 12) return { code: 'bloom_month_invalid' };
    }
  }
  return null;
}

/**
 * スポットを新規作成する。`spots` → `images` → `spot_flowers` の順に Service Role で書き込む。
 * 画像は `validateImageOwner` で親存在チェック（A 層 + B 層）。失敗時は `save_failed` を返す。
 */
export async function createSpot(
  input: SpotMutationInput,
): Promise<{ ok: true; id: string } | { ok: false; error: SpotMutationError }> {
  const validation = validateSpotInput(input);
  if (validation) return { ok: false, error: validation };

  const admin = createAdminClient();

  const { data: inserted, error: insertError } = await admin
    .from('spots')
    .insert({
      name: input.name.trim(),
      name_kana: input.nameKana?.trim() || null,
      description: input.description?.trim() || null,
      prefecture_id: input.prefectureId,
      location: input.location.trim(),
      coordinates: `SRID=4326;POINT(${input.longitude} ${input.latitude})`,
      official_url: input.officialUrl?.trim() || null,
      source: input.source?.trim() || null,
      access_info: input.accessInfo?.trim() || null,
      parking_info: input.parkingInfo?.trim() || null,
      entrance_fee: input.entranceFee?.trim() || null,
      best_season_start: input.bestSeasonStart,
      best_season_end: input.bestSeasonEnd,
      is_published: input.isPublished,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('[createSpot] failed to insert spot', insertError);
    return { ok: false, error: { code: 'save_failed', message: insertError?.message } };
  }

  const spotId = inserted.id as string;

  if (input.images.length > 0) {
    const validOwner = await validateImageOwner(admin, 'spot', spotId);
    if (!validOwner) {
      console.error('[createSpot] image owner validation failed for new spot', spotId);
      return { ok: false, error: { code: 'save_failed', message: 'image_owner_invalid' } };
    }
    const imgRows = input.images.map((img, i) => ({
      owner_type: 'spot' as const,
      owner_id: spotId,
      url: img.url.trim(),
      caption: img.caption?.trim() || null,
      display_order: img.displayOrder ?? i,
    }));
    const { error: imgError } = await admin.from('images').insert(imgRows);
    if (imgError) {
      console.error('[createSpot] failed to insert images', imgError);
      return { ok: false, error: { code: 'save_failed', message: imgError.message } };
    }
  }

  if (input.flowers.length > 0) {
    const sfRows = input.flowers.map((f) => ({
      spot_id: spotId,
      flower_id: f.flowerId,
      bloom_start_month: f.bloomStartMonth,
      bloom_end_month: f.bloomEndMonth,
    }));
    const { error: sfError } = await admin.from('spot_flowers').insert(sfRows);
    if (sfError) {
      console.error('[createSpot] failed to insert spot_flowers', sfError);
      return { ok: false, error: { code: 'save_failed', message: sfError.message } };
    }
  }

  return { ok: true, id: spotId };
}

/**
 * スポットを全項目更新する。画像 / 関連花は **置き換え** 方式：
 * 既存の `images` / `spot_flowers` を一旦論理削除し、新しい配列で再挿入する。
 * 並び替えは「display_order を順番に振り直し」で実現する。
 *
 * `spot_flowers` は中間テーブルかつ PK が (spot_id, flower_id) なので、再挿入時の
 * 重複は `upsert(..., { onConflict: 'spot_id,flower_id' })` で吸収して論理削除を
 * 復活させる。CLAUDE.md 「物理削除は禁止。全テーブルに deleted_at を持たせる」準拠。
 */
export async function updateSpot(
  id: string,
  input: SpotMutationInput,
): Promise<{ ok: true } | { ok: false; error: SpotMutationError }> {
  const validation = validateSpotInput(input);
  if (validation) return { ok: false, error: validation };

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from('spots')
    .update({
      name: input.name.trim(),
      name_kana: input.nameKana?.trim() || null,
      description: input.description?.trim() || null,
      prefecture_id: input.prefectureId,
      location: input.location.trim(),
      coordinates: `SRID=4326;POINT(${input.longitude} ${input.latitude})`,
      official_url: input.officialUrl?.trim() || null,
      source: input.source?.trim() || null,
      access_info: input.accessInfo?.trim() || null,
      parking_info: input.parkingInfo?.trim() || null,
      entrance_fee: input.entranceFee?.trim() || null,
      best_season_start: input.bestSeasonStart,
      best_season_end: input.bestSeasonEnd,
      is_published: input.isPublished,
    })
    .eq('id', id)
    .is('deleted_at', null);

  if (updateError) {
    console.error('[updateSpot] failed to update spot', updateError);
    return { ok: false, error: { code: 'save_failed', message: updateError.message } };
  }

  // 画像を置き換え：既存を論理削除 → 新規挿入
  const { error: imgDeleteError } = await admin
    .from('images')
    .update({ deleted_at: new Date().toISOString() })
    .eq('owner_type', 'spot')
    .eq('owner_id', id)
    .is('deleted_at', null);
  if (imgDeleteError) {
    console.error('[updateSpot] failed to soft-delete existing images', imgDeleteError);
    return { ok: false, error: { code: 'save_failed', message: imgDeleteError.message } };
  }

  if (input.images.length > 0) {
    const validOwner = await validateImageOwner(admin, 'spot', id);
    if (!validOwner) {
      return { ok: false, error: { code: 'save_failed', message: 'image_owner_invalid' } };
    }
    const imgRows = input.images.map((img, i) => ({
      owner_type: 'spot' as const,
      owner_id: id,
      url: img.url.trim(),
      caption: img.caption?.trim() || null,
      display_order: img.displayOrder ?? i,
    }));
    const { error: imgError } = await admin.from('images').insert(imgRows);
    if (imgError) {
      console.error('[updateSpot] failed to insert images', imgError);
      return { ok: false, error: { code: 'save_failed', message: imgError.message } };
    }
  }

  // 関連花の置き換え：既存のアクティブ行を論理削除 → 入力された花を upsert
  // で復活 / 挿入する。PK が (spot_id, flower_id) なので同一ペアの再登録は
  // onConflict で deleted_at: null に戻す形で吸収する。
  const now = new Date().toISOString();
  const { error: sfDeleteError } = await admin
    .from('spot_flowers')
    .update({ deleted_at: now })
    .eq('spot_id', id)
    .is('deleted_at', null);
  if (sfDeleteError) {
    console.error('[updateSpot] failed to soft-delete existing spot_flowers', sfDeleteError);
    return { ok: false, error: { code: 'save_failed', message: sfDeleteError.message } };
  }

  if (input.flowers.length > 0) {
    const sfRows = input.flowers.map((f) => ({
      spot_id: id,
      flower_id: f.flowerId,
      bloom_start_month: f.bloomStartMonth,
      bloom_end_month: f.bloomEndMonth,
      deleted_at: null,
    }));
    const { error: sfError } = await admin
      .from('spot_flowers')
      .upsert(sfRows, { onConflict: 'spot_id,flower_id' });
    if (sfError) {
      console.error('[updateSpot] failed to upsert spot_flowers', sfError);
      return { ok: false, error: { code: 'save_failed', message: sfError.message } };
    }
  }

  return { ok: true };
}

/**
 * `is_published` だけを切り替える。一覧 / 公開待ち画面のトグル用。
 */
export async function setSpotPublished(
  id: string,
  isPublished: boolean,
): Promise<{ ok: true } | { ok: false; error: SpotMutationError }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('spots')
    .update({ is_published: isPublished })
    .eq('id', id)
    .is('deleted_at', null);
  if (error) {
    console.error('[setSpotPublished] failed', error);
    return { ok: false, error: { code: 'save_failed', message: error.message } };
  }
  return { ok: true };
}

/**
 * スポットを論理削除する。`cascade_soft_delete_spot_images_trigger` で子の画像も自動論理削除される。
 */
export async function softDeleteSpot(
  id: string,
): Promise<{ ok: true } | { ok: false; error: SpotMutationError }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('spots')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  if (error) {
    console.error('[softDeleteSpot] failed', error);
    return { ok: false, error: { code: 'save_failed', message: error.message } };
  }
  return { ok: true };
}
