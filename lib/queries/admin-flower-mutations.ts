import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateImageOwner } from '@/lib/utils/imageValidator';

/**
 * 管理画面の花マスター系 mutation 共通ロジック。`admin-spot-mutations.ts` と同じ方針で、
 * Service Role を使い `flowers` / `flower_aliases` / `images` に直接書き込む。
 * **呼び出し前に必ず `requireAdmin()` を通すこと。**
 */

export type FlowerImageInput = {
  url: string;
  caption?: string | null;
  displayOrder: number;
};

export type FlowerAliasInput = {
  alias: string;
};

export type FlowerMutationInput = {
  name: string;
  nameKana: string | null;
  description: string | null;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  images: FlowerImageInput[];
  aliases: FlowerAliasInput[];
};

export type FlowerMutationError =
  | { code: 'name_required' }
  | { code: 'name_duplicate' }
  | { code: 'season_invalid' }
  | { code: 'season_pair_required' }
  | { code: 'image_url_invalid' }
  | { code: 'alias_required' }
  | { code: 'alias_duplicate_in_form'; message?: string }
  | { code: 'alias_duplicate'; message?: string }
  | { code: 'save_failed'; message?: string };

/**
 * `FlowerMutationInput` の最低限の正当性チェック。
 * - 名前必須
 * - 見頃は両方未設定または両方 1〜12 の範囲（片方だけは不可）
 * - alias は空白不可・同フォーム内で重複不可
 * - 画像 URL は http(s) で始まること
 */
export function validateFlowerInput(input: FlowerMutationInput): FlowerMutationError | null {
  if (!input.name.trim()) return { code: 'name_required' };

  const startSet = input.defaultSeasonStart != null;
  const endSet = input.defaultSeasonEnd != null;
  if (startSet !== endSet) return { code: 'season_pair_required' };
  if (startSet && endSet) {
    const s = input.defaultSeasonStart!;
    const e = input.defaultSeasonEnd!;
    if (!Number.isInteger(s) || s < 1 || s > 12 || !Number.isInteger(e) || e < 1 || e > 12) {
      return { code: 'season_invalid' };
    }
  }

  for (const img of input.images) {
    if (!img.url.trim() || !/^https?:\/\//.test(img.url)) {
      return { code: 'image_url_invalid' };
    }
  }

  const seen = new Set<string>();
  for (const a of input.aliases) {
    const trimmed = a.alias.trim();
    if (!trimmed) return { code: 'alias_required' };
    if (seen.has(trimmed)) {
      return { code: 'alias_duplicate_in_form', message: trimmed };
    }
    seen.add(trimmed);
  }

  return null;
}

/**
 * Supabase のエラーから unique 制約違反を判定する。`error.code === '23505'` が pg の unique
 * 違反コード。Supabase JS は code をそのまま投げてくるので、これを見て分岐する。
 */
function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

/**
 * 花を新規作成する。flowers → images → flower_aliases の順で挿入。
 * name UNIQUE / alias UNIQUE の衝突は専用エラーコードで返す。
 */
export async function createFlower(
  input: FlowerMutationInput,
): Promise<{ ok: true; id: string } | { ok: false; error: FlowerMutationError }> {
  const validation = validateFlowerInput(input);
  if (validation) return { ok: false, error: validation };

  const admin = createAdminClient();

  const { data: inserted, error: insertError } = await admin
    .from('flowers')
    .insert({
      name: input.name.trim(),
      name_kana: input.nameKana?.trim() || null,
      description: input.description?.trim() || null,
      default_season_start: input.defaultSeasonStart,
      default_season_end: input.defaultSeasonEnd,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    if (isUniqueViolation(insertError)) {
      return { ok: false, error: { code: 'name_duplicate' } };
    }
    console.error('[createFlower] failed to insert flower', insertError);
    return { ok: false, error: { code: 'save_failed', message: insertError?.message } };
  }

  const flowerId = inserted.id as string;

  if (input.images.length > 0) {
    const validOwner = await validateImageOwner(admin, 'flower', flowerId);
    if (!validOwner) {
      console.error('[createFlower] image owner validation failed for new flower', flowerId);
      return { ok: false, error: { code: 'save_failed', message: 'image_owner_invalid' } };
    }
    const imgRows = input.images.map((img, i) => ({
      owner_type: 'flower' as const,
      owner_id: flowerId,
      url: img.url.trim(),
      caption: img.caption?.trim() || null,
      display_order: img.displayOrder ?? i,
    }));
    const { error: imgError } = await admin.from('images').insert(imgRows);
    if (imgError) {
      console.error('[createFlower] failed to insert images', imgError);
      return { ok: false, error: { code: 'save_failed', message: imgError.message } };
    }
  }

  if (input.aliases.length > 0) {
    const aliasRows = input.aliases.map((a) => ({
      flower_id: flowerId,
      alias: a.alias.trim(),
    }));
    const { error: aliasError } = await admin.from('flower_aliases').insert(aliasRows);
    if (aliasError) {
      if (isUniqueViolation(aliasError)) {
        return {
          ok: false,
          error: { code: 'alias_duplicate', message: aliasError.details ?? undefined },
        };
      }
      console.error('[createFlower] failed to insert aliases', aliasError);
      return { ok: false, error: { code: 'save_failed', message: aliasError.message } };
    }
  }

  return { ok: true, id: flowerId };
}

/**
 * 花を全項目更新する。spot と同じく置き換え方式：
 * 既存の `images` / `flower_aliases` を論理削除 → 入力された配列で再挿入。
 *
 * alias は `(alias)` で全体 UNIQUE のため、論理削除済みでも UNIQUE 制約に引っかかる。
 * このため insert ではなく upsert で `onConflict: 'alias'` を指定し、論理削除済みなら
 * `flower_id` と `deleted_at: null` を上書きして復活させる。
 *
 * 他 flower の active な alias と衝突した場合は upsert が成功し flower_id を奪うリスクが
 * あるため、事前に「入力 alias のうち、他 flower の active で持たれているもの」を引いて
 * 検出する。
 */
export async function updateFlower(
  id: string,
  input: FlowerMutationInput,
): Promise<{ ok: true } | { ok: false; error: FlowerMutationError }> {
  const validation = validateFlowerInput(input);
  if (validation) return { ok: false, error: validation };

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from('flowers')
    .update({
      name: input.name.trim(),
      name_kana: input.nameKana?.trim() || null,
      description: input.description?.trim() || null,
      default_season_start: input.defaultSeasonStart,
      default_season_end: input.defaultSeasonEnd,
    })
    .eq('id', id)
    .is('deleted_at', null);

  if (updateError) {
    if (isUniqueViolation(updateError)) {
      return { ok: false, error: { code: 'name_duplicate' } };
    }
    console.error('[updateFlower] failed to update flower', updateError);
    return { ok: false, error: { code: 'save_failed', message: updateError.message } };
  }

  // 既存画像を論理削除 → 新規挿入で置き換え
  const nowIso = new Date().toISOString();
  const { error: imgDeleteError } = await admin
    .from('images')
    .update({ deleted_at: nowIso })
    .eq('owner_type', 'flower')
    .eq('owner_id', id)
    .is('deleted_at', null);
  if (imgDeleteError) {
    console.error('[updateFlower] failed to soft-delete images', imgDeleteError);
    return { ok: false, error: { code: 'save_failed', message: imgDeleteError.message } };
  }

  if (input.images.length > 0) {
    const validOwner = await validateImageOwner(admin, 'flower', id);
    if (!validOwner) {
      return { ok: false, error: { code: 'save_failed', message: 'image_owner_invalid' } };
    }
    const imgRows = input.images.map((img, i) => ({
      owner_type: 'flower' as const,
      owner_id: id,
      url: img.url.trim(),
      caption: img.caption?.trim() || null,
      display_order: img.displayOrder ?? i,
    }));
    const { error: imgError } = await admin.from('images').insert(imgRows);
    if (imgError) {
      console.error('[updateFlower] failed to insert images', imgError);
      return { ok: false, error: { code: 'save_failed', message: imgError.message } };
    }
  }

  // alias の置き換え：まず他 flower の active alias と衝突しないか確認
  const trimmedAliases = input.aliases.map((a) => a.alias.trim());
  if (trimmedAliases.length > 0) {
    const { data: conflicts, error: conflictError } = await admin
      .from('flower_aliases')
      .select('alias, flower_id')
      .in('alias', trimmedAliases)
      .is('deleted_at', null)
      .neq('flower_id', id);
    if (conflictError) {
      console.error('[updateFlower] failed to check alias conflicts', conflictError);
      return { ok: false, error: { code: 'save_failed', message: conflictError.message } };
    }
    if (conflicts && conflicts.length > 0) {
      const aliases = conflicts.map((c) => c.alias).join(', ');
      return { ok: false, error: { code: 'alias_duplicate', message: aliases } };
    }
  }

  // 自分の active な alias は一旦論理削除（再挿入時に upsert で復活）
  const { error: aliasDeleteError } = await admin
    .from('flower_aliases')
    .update({ deleted_at: nowIso })
    .eq('flower_id', id)
    .is('deleted_at', null);
  if (aliasDeleteError) {
    console.error('[updateFlower] failed to soft-delete aliases', aliasDeleteError);
    return { ok: false, error: { code: 'save_failed', message: aliasDeleteError.message } };
  }

  if (trimmedAliases.length > 0) {
    const aliasRows = trimmedAliases.map((alias) => ({
      flower_id: id,
      alias,
      deleted_at: null,
    }));
    const { error: aliasUpsertError } = await admin
      .from('flower_aliases')
      .upsert(aliasRows, { onConflict: 'alias' });
    if (aliasUpsertError) {
      if (isUniqueViolation(aliasUpsertError)) {
        return {
          ok: false,
          error: { code: 'alias_duplicate', message: aliasUpsertError.details ?? undefined },
        };
      }
      console.error('[updateFlower] failed to upsert aliases', aliasUpsertError);
      return { ok: false, error: { code: 'save_failed', message: aliasUpsertError.message } };
    }
  }

  return { ok: true };
}

/**
 * 花を論理削除する。`cascade_soft_delete_flower_images` トリガーで画像はカスケード論理削除。
 * `flower_aliases` は cascade 設定が無いため明示的に同時刻で論理削除する。
 */
export async function softDeleteFlower(
  id: string,
): Promise<{ ok: true } | { ok: false; error: FlowerMutationError }> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { error: flowerError } = await admin
    .from('flowers')
    .update({ deleted_at: nowIso })
    .eq('id', id)
    .is('deleted_at', null);
  if (flowerError) {
    console.error('[softDeleteFlower] failed', flowerError);
    return { ok: false, error: { code: 'save_failed', message: flowerError.message } };
  }

  const { error: aliasError } = await admin
    .from('flower_aliases')
    .update({ deleted_at: nowIso })
    .eq('flower_id', id)
    .is('deleted_at', null);
  if (aliasError) {
    console.error('[softDeleteFlower] failed to soft-delete aliases', aliasError);
    return { ok: false, error: { code: 'save_failed', message: aliasError.message } };
  }

  return { ok: true };
}
