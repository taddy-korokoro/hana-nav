import { createClient } from '@/lib/supabase/server';

export type MyReviewForSpot = {
  id: string;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 指定スポットに対する自分のレビューを返す。論理削除済みは「投稿していない」と扱う（再投稿時は
 * POST /api/reviews のアップサートで `deleted_at = NULL` に戻る）。RLS により他人の行は触れない
 * ので、`auth.uid()` 経由の `userId` を渡す前提で安全。
 */
export async function getMyReviewForSpot(
  userId: string,
  spotId: string,
): Promise<MyReviewForSpot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, visited_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('spot_id', spotId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(`[getMyReviewForSpot] ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id,
    rating: data.rating,
    comment: data.comment,
    visitedAt: data.visited_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export type MyReviewListItem = {
  reviewId: string;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
  spot: {
    id: string;
    name: string;
    prefectureName: string;
    bestSeasonStart: number;
    bestSeasonEnd: number;
    coverImageUrl: string | null;
  };
};

/**
 * マイページの「自分のレビュー」一覧。親スポットが論理削除 / 非公開になったものは除外する。
 * スポット画像は多態関連の `images` から別クエリで取得する（join 不可のため）。
 */
export async function getMyReviews(userId: string): Promise<MyReviewListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      id, rating, comment, visited_at, created_at, updated_at,
      spot:spots!inner(
        id, name, is_published, deleted_at, best_season_start, best_season_end,
        prefecture:prefectures(name)
      )
    `,
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('spot.is_published', true)
    .is('spot.deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`[getMyReviews] ${error.message}`);
  }

  type Row = {
    id: string;
    rating: number;
    comment: string | null;
    visited_at: string | null;
    created_at: string;
    updated_at: string;
    spot:
      | {
          id: string;
          name: string;
          best_season_start: number;
          best_season_end: number;
          prefecture: { name: string } | { name: string }[] | null;
        }
      | {
          id: string;
          name: string;
          best_season_start: number;
          best_season_end: number;
          prefecture: { name: string } | { name: string }[] | null;
        }[]
      | null;
  };

  const rows = (data as unknown as Row[] | null) ?? [];
  const items = rows
    .map((r) => {
      const spot = Array.isArray(r.spot) ? r.spot[0] : r.spot;
      if (!spot) return null;
      const prefecture = Array.isArray(spot.prefecture) ? spot.prefecture[0] : spot.prefecture;
      const item: MyReviewListItem = {
        reviewId: r.id,
        rating: r.rating,
        comment: r.comment,
        visitedAt: r.visited_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        spot: {
          id: spot.id,
          name: spot.name,
          prefectureName: prefecture?.name ?? '',
          bestSeasonStart: spot.best_season_start,
          bestSeasonEnd: spot.best_season_end,
          coverImageUrl: null,
        },
      };
      return item;
    })
    .filter((v): v is MyReviewListItem => v !== null);

  if (items.length === 0) return items;

  const spotIds = items.map((i) => i.spot.id);
  const { data: imageRows, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', spotIds)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (imgError) {
    console.error('[getMyReviews] failed to fetch cover images', imgError);
    return items;
  }

  const coverByOwner = new Map<string, string>();
  for (const img of imageRows ?? []) {
    if (!coverByOwner.has(img.owner_id)) coverByOwner.set(img.owner_id, img.url);
  }

  return items.map((item) => ({
    ...item,
    spot: { ...item.spot, coverImageUrl: coverByOwner.get(item.spot.id) ?? null },
  }));
}
