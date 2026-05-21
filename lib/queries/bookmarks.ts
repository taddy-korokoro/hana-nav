import { createClient } from '@/lib/supabase/server';

export type BookmarkListItem = {
  spotId: string;
  spotName: string;
  prefectureName: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  flowerNames: string[];
  coverImageUrl: string | null;
  coverImageCaption: string | null;
  bookmarkedAt: string;
};

/**
 * 指定ユーザーが指定スポットをブックマーク中かどうかを返す。
 * 論理削除済みは「ブックマークしていない」と扱う。RLS により他人のレコードは見えないため
 * `user_id` に `auth.uid()` を渡す前提。Server Component / Server Action から呼ぶ。
 */
export async function isBookmarked(userId: string, spotId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('spot_id', spotId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(`[isBookmarked] ${error.message}`);
  }
  return !!data;
}

/**
 * マイページ用の自分のブックマーク一覧。
 * - 親スポットが論理削除 / 非公開になったものは除外
 * - 画像は `images` の多態関連で別クエリ取得（join 不可のため）
 * - 花名は `spot_flowers` join で先頭数件のみ表示用に取得
 *
 * ブックマーク自体の RLS は `auth.uid() = user_id AND deleted_at IS NULL` で守られているが、
 * 親 `spots` 側のフィルタ（`is_published = true`、`deleted_at IS NULL`）は spots 側の RLS が
 * かかった上でさらにアプリ側でも明示する。
 */
export async function getMyBookmarks(userId: string): Promise<BookmarkListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bookmarks')
    .select(
      `
      created_at,
      spot:spots!inner(
        id, name, best_season_start, best_season_end, is_published, deleted_at,
        prefecture:prefectures(id, name),
        spot_flowers(
          deleted_at,
          flower:flowers!inner(id, name, deleted_at)
        )
      )
    `,
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('spot.is_published', true)
    .is('spot.deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`[getMyBookmarks] ${error.message}`);
  }

  type Row = {
    created_at: string;
    spot:
      | {
          id: string;
          name: string;
          best_season_start: number;
          best_season_end: number;
          prefecture: { id: number; name: string } | { id: number; name: string }[] | null;
          spot_flowers: Array<{
            deleted_at: string | null;
            flower:
              | { id: string; name: string; deleted_at: string | null }
              | { id: string; name: string; deleted_at: string | null }[]
              | null;
          }> | null;
        }
      | {
          id: string;
          name: string;
          best_season_start: number;
          best_season_end: number;
          prefecture: { id: number; name: string } | { id: number; name: string }[] | null;
          spot_flowers: Array<{
            deleted_at: string | null;
            flower:
              | { id: string; name: string; deleted_at: string | null }
              | { id: string; name: string; deleted_at: string | null }[]
              | null;
          }> | null;
        }[]
      | null;
  };

  const rows = (data as unknown as Row[] | null) ?? [];
  const items = rows
    .map((r) => {
      const spot = Array.isArray(r.spot) ? r.spot[0] : r.spot;
      if (!spot) return null;
      const prefecture = Array.isArray(spot.prefecture) ? spot.prefecture[0] : spot.prefecture;
      const flowerNames = (spot.spot_flowers ?? [])
        .filter((sf) => sf.deleted_at === null)
        .map((sf) => (Array.isArray(sf.flower) ? sf.flower[0] : sf.flower))
        .filter((f): f is { id: string; name: string; deleted_at: string | null } => f !== null)
        .filter((f) => f.deleted_at === null)
        .map((f) => f.name);

      const item: BookmarkListItem = {
        spotId: spot.id,
        spotName: spot.name,
        prefectureName: prefecture?.name ?? '',
        bestSeasonStart: spot.best_season_start,
        bestSeasonEnd: spot.best_season_end,
        flowerNames,
        coverImageUrl: null,
        coverImageCaption: null,
        bookmarkedAt: r.created_at,
      };
      return item;
    })
    .filter((v): v is BookmarkListItem => v !== null);

  if (items.length === 0) return items;

  const spotIds = items.map((i) => i.spotId);
  const { data: imageRows, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, caption, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', spotIds)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (imgError) {
    console.error('[getMyBookmarks] failed to fetch cover images', imgError);
    return items;
  }

  const coverByOwner = new Map<string, { url: string; caption: string | null }>();
  for (const img of imageRows ?? []) {
    if (!coverByOwner.has(img.owner_id)) {
      coverByOwner.set(img.owner_id, { url: img.url, caption: img.caption ?? null });
    }
  }

  return items.map((item) => ({
    ...item,
    coverImageUrl: coverByOwner.get(item.spotId)?.url ?? null,
    coverImageCaption: coverByOwner.get(item.spotId)?.caption ?? null,
  }));
}
