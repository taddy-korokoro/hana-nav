import type { SupabaseClient } from '@supabase/supabase-js';

export type ImageOwnerType = 'spot' | 'flower';

/**
 * `images.owner_type` / `owner_id` の参照先が実在し、論理削除されていないかをアプリ層で確認する。
 *
 * `images` は多態関連（spot / flower）のため外部キー制約をかけられない。DB 側にも
 * 同等の検証トリガー `validate_image_owner_trigger` を設けているが、アプリ層でも
 * 同じ検証をかけることで「2 層防御」を担保する（`docs/specs/database.md` 参照）。
 *
 * Service Role を渡すこと（admin 系の INSERT 経路のみで使うため）。
 */
export async function validateImageOwner(
  supabaseAdmin: SupabaseClient,
  ownerType: ImageOwnerType,
  ownerId: string,
): Promise<boolean> {
  const table = ownerType === 'spot' ? 'spots' : 'flowers';
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', ownerId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) {
    console.error('[validateImageOwner] failed', { ownerType, ownerId, error });
    return false;
  }
  return !!data;
}

export type InsertImageInput = {
  ownerType: ImageOwnerType;
  ownerId: string;
  url: string;
  caption?: string | null;
  displayOrder: number;
};

/**
 * 親存在チェックを行ったうえで `images` に INSERT する。
 * 親が見つからない場合は例外を投げる（呼び出し側でハンドリング）。
 */
export async function insertImage(
  supabaseAdmin: SupabaseClient,
  input: InsertImageInput,
): Promise<{ id: string }> {
  const ok = await validateImageOwner(supabaseAdmin, input.ownerType, input.ownerId);
  if (!ok) {
    throw new Error(`Invalid owner reference: ${input.ownerType} ${input.ownerId}`);
  }

  const { data, error } = await supabaseAdmin
    .from('images')
    .insert({
      owner_type: input.ownerType,
      owner_id: input.ownerId,
      url: input.url,
      caption: input.caption ?? null,
      display_order: input.displayOrder,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert image: ${error?.message ?? 'unknown error'}`);
  }
  return { id: data.id };
}
