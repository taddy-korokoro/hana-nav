import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isInBestSeason } from '@/lib/utils/seasonUtils';
import type { SpotSearchResult } from '@/lib/queries/spotSearch';

export type Prefecture = {
  id: number;
  name: string;
  region: string;
  displayOrder: number;
};

export type AreaMonthlyFlower = {
  flowerId: string;
  flowerName: string;
  spotCount: number;
};

export type AreaMonthlyCalendar = {
  month: number; // 1-12
  flowers: AreaMonthlyFlower[];
};

export type AreaDetail = {
  prefecture: Prefecture;
  spots: SpotSearchResult[];
  monthly: AreaMonthlyCalendar[];
  relatedPrefectures: Prefecture[];
};

/**
 * 都道府県マスター行の取得をリクエスト内でメモ化する。
 * `generateMetadata` と `page` の両方で同じ id を引くため重複ラウンドトリップを抑える。
 * （CLAUDE.md「同一リクエスト内で同じデータを複数コンポーネントから取りたい場合は
 *  React.cache() でメモ化する」）
 */
const fetchPrefectureRow = cache(async (id: number) => {
  const supabase = await createClient();
  return supabase
    .from('prefectures')
    .select('id, name, region, display_order')
    .eq('id', id)
    .maybeSingle();
});

export async function getPrefecture(id: number): Promise<Prefecture | null> {
  const { data, error } = await fetchPrefectureRow(id);
  if (error) {
    console.error('[getPrefecture] failed to fetch prefecture', error);
    throw error;
  }
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    region: data.region,
    displayOrder: data.display_order,
  };
}

/**
 * 47 都道府県を `display_order` で全件返す。`generateStaticParams` と
 * `/api/prefectures` の両方から呼ばれるので一箇所に集約する。
 */
export async function getAllPrefectures(): Promise<Prefecture[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prefectures')
    .select('id, name, region, display_order')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getAllPrefectures] failed', error);
    throw error;
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    region: p.region,
    displayOrder: p.display_order,
  }));
}

/**
 * 指定都道府県の公開済みスポット一覧 + 月別見頃カレンダー + 同一地方の関連都道府県をまとめて取得。
 * 月別カレンダーは `spot_flowers.bloom_*_month`（無ければ `flowers.default_season_*`）を 1〜12 月で
 * クロス集計し、その月に見られる花と該当スポット数を返す。
 *
 * `generateMetadata` と `page` の両方で同じバンドルを引くので `React.cache()` でメモ化する
 * （CLAUDE.md「同一リクエスト内で同じデータを複数コンポーネントから取りたい場合は
 *  React.cache() でメモ化する」）。
 */
export const getAreaDetail = cache(async (prefectureId: number): Promise<AreaDetail | null> => {
  const prefecture = await getPrefecture(prefectureId);
  if (!prefecture) return null;

  const supabase = await createClient();

  type SpotRow = {
    id: string;
    name: string;
    best_season_start: number;
    best_season_end: number;
    latitude: number | null;
    longitude: number | null;
    spot_flowers:
      | {
          bloom_start_month: number | null;
          bloom_end_month: number | null;
          flower:
            | {
                id: string;
                name: string;
                default_season_start: number | null;
                default_season_end: number | null;
              }
            | {
                id: string;
                name: string;
                default_season_start: number | null;
                default_season_end: number | null;
              }[]
            | null;
        }[]
      | null;
  };

  const { data: spotsRaw, error: spotsError } = await supabase
    .from('spots')
    .select(
      `
      id,
      name,
      best_season_start,
      best_season_end,
      latitude:spots_latitude,
      longitude:spots_longitude,
      spot_flowers!left(
        bloom_start_month,
        bloom_end_month,
        flower:flowers(id, name, default_season_start, default_season_end)
      )
    `,
    )
    .eq('prefecture_id', prefectureId)
    .eq('is_published', true)
    .is('deleted_at', null)
    .filter('spot_flowers.deleted_at', 'is', null)
    .order('name_kana', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (spotsError) {
    console.error('[getAreaDetail] failed to fetch spots', spotsError);
    throw spotsError;
  }

  const rows = (spotsRaw ?? []) as unknown as SpotRow[];

  // 関連都道府県（同一地方区分。自分自身は除く）と画像取得を並列化
  const ids = rows.map((r) => r.id);
  const [imageRows, relatedPrefectures] = await Promise.all([
    fetchSpotCovers(ids),
    fetchRelatedPrefectures(prefecture.region, prefecture.id),
  ]);

  const spots: SpotSearchResult[] = rows.map((r) => {
    const flowerNames = (r.spot_flowers ?? [])
      .map((sf) => {
        const f = Array.isArray(sf.flower) ? sf.flower[0] : sf.flower;
        return f?.name ?? null;
      })
      .filter((n): n is string => !!n);

    return {
      id: r.id,
      name: r.name,
      prefectureName: prefecture.name,
      region: prefecture.region,
      bestSeasonStart: r.best_season_start,
      bestSeasonEnd: r.best_season_end,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      coverImageUrl: imageRows.get(r.id)?.url ?? null,
      coverImageCaption: imageRows.get(r.id)?.caption ?? null,
      flowerNames,
    };
  });

  return {
    prefecture,
    spots,
    monthly: buildMonthlyCalendar(rows),
    relatedPrefectures,
  };
});

async function fetchSpotCovers(
  spotIds: string[],
): Promise<Map<string, { url: string; caption: string | null }>> {
  if (spotIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('images')
    .select('owner_id, url, caption, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', spotIds)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getAreaDetail] failed to fetch spot images', error);
    return new Map();
  }

  const coverByOwner = new Map<string, { url: string; caption: string | null }>();
  for (const img of data ?? []) {
    if (!coverByOwner.has(img.owner_id)) {
      coverByOwner.set(img.owner_id, { url: img.url, caption: img.caption ?? null });
    }
  }
  return coverByOwner;
}

async function fetchRelatedPrefectures(region: string, excludeId: number): Promise<Prefecture[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prefectures')
    .select('id, name, region, display_order')
    .eq('region', region)
    .neq('id', excludeId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getAreaDetail] failed to fetch related prefectures', error);
    return [];
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    region: p.region,
    displayOrder: p.display_order,
  }));
}

/**
 * スポット x 花の組み合わせを 1〜12 月で展開し、月ごとの花リスト（重複排除 + スポット件数）を作る。
 * `spot_flowers.bloom_*_month` が NULL の場合は `flowers.default_season_*` をフォールバックに使う
 * （`docs/specs/database.md`「見頃情報の3層構造」に準拠）。両方 NULL の組み合わせは集計から除外する。
 */
function buildMonthlyCalendar(
  rows: Array<{
    id: string;
    spot_flowers:
      | {
          bloom_start_month: number | null;
          bloom_end_month: number | null;
          flower:
            | {
                id: string;
                name: string;
                default_season_start: number | null;
                default_season_end: number | null;
              }
            | {
                id: string;
                name: string;
                default_season_start: number | null;
                default_season_end: number | null;
              }[]
            | null;
        }[]
      | null;
  }>,
): AreaMonthlyCalendar[] {
  // month -> flowerId -> { name, spotIds: Set }
  const buckets = new Map<number, Map<string, { name: string; spotIds: Set<string> }>>();
  for (let m = 1; m <= 12; m += 1) buckets.set(m, new Map());

  for (const row of rows) {
    for (const sf of row.spot_flowers ?? []) {
      const flower = Array.isArray(sf.flower) ? sf.flower[0] : sf.flower;
      if (!flower) continue;

      const start = sf.bloom_start_month ?? flower.default_season_start;
      const end = sf.bloom_end_month ?? flower.default_season_end;
      if (start == null || end == null) continue;

      for (let m = 1; m <= 12; m += 1) {
        if (!isInBestSeason(start, end, m)) continue;
        const monthBucket = buckets.get(m)!;
        const entry = monthBucket.get(flower.id) ?? {
          name: flower.name,
          spotIds: new Set<string>(),
        };
        entry.spotIds.add(row.id);
        monthBucket.set(flower.id, entry);
      }
    }
  }

  return Array.from(buckets.entries()).map(([month, flowerMap]) => ({
    month,
    flowers: Array.from(flowerMap.entries())
      .map(([flowerId, value]) => ({
        flowerId,
        flowerName: value.name,
        spotCount: value.spotIds.size,
      }))
      .sort((a, b) => b.spotCount - a.spotCount || a.flowerName.localeCompare(b.flowerName, 'ja')),
  }));
}
