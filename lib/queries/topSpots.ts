import { createAnonClient } from '@/lib/supabase/anon';
import { tokyoMonth } from '@/lib/utils/dateUtils';
import { isInBestSeason } from '@/lib/utils/seasonUtils';

export type SeasonalSpot = {
  id: string;
  name: string;
  prefectureName: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  coverImageCaption: string | null;
  flowerNames: string[];
};

/**
 * 今月見頃かつ公開済みのスポットを取得する。
 * `isInBestSeason` の月またぎ判定と PostGIS GEOGRAPHY → lat/lng 変換は server 側で済ませ、
 * Client（地図）には素の数値だけ渡せる形にする。
 */
export async function getSeasonalSpots(limit = 24): Promise<SeasonalSpot[]> {
  const supabase = createAnonClient();
  const currentMonth = tokyoMonth();

  const { data: spots, error } = await supabase
    .from('spots')
    .select(
      `
      id,
      name,
      best_season_start,
      best_season_end,
      latitude:spots_latitude,
      longitude:spots_longitude,
      prefecture:prefectures(name),
      spot_flowers(flower:flowers(name))
    `,
    )
    .eq('is_published', true)
    .is('deleted_at', null);

  if (error) {
    console.error('[getSeasonalSpots] failed to fetch spots', error);
    return [];
  }

  const inSeason = (spots ?? []).filter((s) =>
    isInBestSeason(s.best_season_start, s.best_season_end, currentMonth),
  );

  if (inSeason.length === 0) return [];

  const ids = inSeason.map((s) => s.id);
  const { data: images, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, caption, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', ids)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });
  if (imgError) console.error('[getSeasonalSpots] failed to fetch spot images', imgError);

  const coverByOwner = new Map<string, { url: string; caption: string | null }>();
  for (const img of images ?? []) {
    if (!coverByOwner.has(img.owner_id)) {
      coverByOwner.set(img.owner_id, { url: img.url, caption: img.caption ?? null });
    }
  }

  return inSeason.slice(0, limit).map((s) => {
    const row = s as unknown as {
      id: string;
      name: string;
      best_season_start: number;
      best_season_end: number;
      latitude: number | null;
      longitude: number | null;
      prefecture: { name: string } | { name: string }[] | null;
      spot_flowers: { flower: { name: string } | { name: string }[] | null }[] | null;
    };
    const prefecture = Array.isArray(row.prefecture) ? row.prefecture[0] : row.prefecture;
    const flowerNames = (row.spot_flowers ?? [])
      .map((sf) => (Array.isArray(sf.flower) ? sf.flower[0]?.name : sf.flower?.name))
      .filter((n): n is string => !!n);
    return {
      id: row.id,
      name: row.name,
      prefectureName: prefecture?.name ?? '',
      bestSeasonStart: row.best_season_start,
      bestSeasonEnd: row.best_season_end,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      coverImageUrl: coverByOwner.get(row.id)?.url ?? null,
      coverImageCaption: coverByOwner.get(row.id)?.caption ?? null,
      flowerNames,
    };
  });
}

export type FeaturedFlower = {
  id: string;
  name: string;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  coverImageUrl: string | null;
  coverImageCaption: string | null;
};

/**
 * トップページの「花から探す」グリッド用に、花マスターを取得する。
 * 画像があれば優先、なければ呼び出し側でグラデーションプレースホルダーを表示する。
 */
export async function getFeaturedFlowers(limit = 12): Promise<FeaturedFlower[]> {
  const supabase = createAnonClient();

  const { data: flowers, error } = await supabase
    .from('flowers')
    .select('id, name, default_season_start, default_season_end')
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .limit(limit);

  if (error || !flowers || flowers.length === 0) return [];

  const ids = flowers.map((f) => f.id);
  const { data: images, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, caption, display_order')
    .eq('owner_type', 'flower')
    .in('owner_id', ids)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });
  if (imgError) console.error('[getFeaturedFlowers] failed to fetch flower images', imgError);

  const coverByOwner = new Map<string, { url: string; caption: string | null }>();
  for (const img of images ?? []) {
    if (!coverByOwner.has(img.owner_id)) {
      coverByOwner.set(img.owner_id, { url: img.url, caption: img.caption ?? null });
    }
  }

  return flowers.map((f) => ({
    id: f.id,
    name: f.name,
    defaultSeasonStart: f.default_season_start ?? null,
    defaultSeasonEnd: f.default_season_end ?? null,
    coverImageUrl: coverByOwner.get(f.id)?.url ?? null,
    coverImageCaption: coverByOwner.get(f.id)?.caption ?? null,
  }));
}
