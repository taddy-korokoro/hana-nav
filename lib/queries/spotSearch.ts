import { createClient } from '@/lib/supabase/server';
import { isInBestSeason } from '@/lib/utils/seasonUtils';

export const SPOTS_PAGE_SIZE = 24;

export type SortKey = 'newest' | 'name' | 'prefecture';
export const DEFAULT_SORT: SortKey = 'newest';

export type ViewKey = 'list' | 'map';
export const DEFAULT_VIEW: ViewKey = 'list';

export type SpotSearchParams = {
  prefecture?: number; // prefectures.id (1-47)
  flower?: string; // flower 名（UNIQUE なので名前で受ける）
  region?: string; // 地方区分名（prefecture 未指定時のみ有効）
  month?: number; // 1-12
  q?: string; // フリーワード
  sort?: SortKey;
  page?: number; // 1-indexed
  view?: ViewKey;
};

export type SpotSearchResult = {
  id: string;
  name: string;
  prefectureName: string;
  region: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  flowerNames: string[];
};

export type SpotSearchPage = {
  items: SpotSearchResult[];
  totalBeforeMonthFilter: number; // SQL LIMIT 前の総件数（SQL フィルタまでの件数）
  totalCount: number; // 月フィルタ適用後の総件数
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * URL `searchParams` を `SpotSearchParams` に正規化する。
 * 未知の値は無視し、デフォルトを補完する。Server Component から呼ぶ。
 */
export function parseSpotSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SpotSearchParams {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const prefRaw = get('prefecture');
  const prefId = prefRaw ? Number.parseInt(prefRaw, 10) : NaN;

  const monthRaw = get('month');
  const month = monthRaw ? Number.parseInt(monthRaw, 10) : NaN;

  const sortRaw = get('sort');
  const sort: SortKey = sortRaw === 'name' || sortRaw === 'prefecture' ? sortRaw : DEFAULT_SORT;

  const viewRaw = get('view');
  const view: ViewKey = viewRaw === 'map' ? 'map' : DEFAULT_VIEW;

  const pageRaw = get('page');
  const page = pageRaw ? Math.max(1, Number.parseInt(pageRaw, 10) || 1) : 1;

  const q = get('q')?.trim();

  return {
    prefecture: Number.isInteger(prefId) && prefId >= 1 && prefId <= 47 ? prefId : undefined,
    flower: get('flower')?.trim() || undefined,
    region: get('region')?.trim() || undefined,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
    q: q && q.length > 0 ? q : undefined,
    sort,
    page,
    view,
  };
}

/**
 * `SpotSearchParams` を URL 用 query string にシリアライズ。チップ Link の href 生成に使う。
 * 既存パラメータと差分マージしたい場合は呼び出し側で merge してから渡す。
 */
export function serializeSpotSearchParams(params: SpotSearchParams): string {
  const sp = new URLSearchParams();
  if (params.prefecture) sp.set('prefecture', String(params.prefecture));
  if (params.flower) sp.set('flower', params.flower);
  if (params.region) sp.set('region', params.region);
  if (params.month) sp.set('month', String(params.month));
  if (params.q) sp.set('q', params.q);
  if (params.sort && params.sort !== DEFAULT_SORT) sp.set('sort', params.sort);
  if (params.view && params.view !== DEFAULT_VIEW) sp.set('view', params.view);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  return sp.toString();
}

/**
 * スポット検索のメインクエリ。`SpotSearchParams` を受けて Supabase に問い合わせ、
 * 月またぎ判定は `isInBestSeason` で JS 側でフィルタする（PostgREST は列同士比較が
 * できないため。詳細は `lib/queries/topSpots.ts` の議論と同じ）。
 *
 * 注意：絞り込み結果の総件数は month フィルタの後に確定するので、SQL の COUNT は使わず
 * 全件取得 → JS フィルタ → slice の順で扱う。MVP スケールで問題ないことは想定済み。
 */
export async function searchSpots(params: SpotSearchParams): Promise<SpotSearchPage> {
  const supabase = await createClient();
  const page = params.page ?? 1;

  // flower 名 → flower_id 解決（spot_flowers 経由で絞るため必要）
  let flowerId: string | null = null;
  if (params.flower) {
    const { data: flower, error } = await supabase
      .from('flowers')
      .select('id')
      .eq('name', params.flower)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) console.error('[searchSpots] failed to resolve flower id', error);
    flowerId = flower?.id ?? null;
    // 指定花が見つからないなら結果は 0 件で確定
    if (!flowerId) {
      return emptyPage(page);
    }
  }

  let query = supabase
    .from('spots')
    .select(
      `
      id,
      name,
      best_season_start,
      best_season_end,
      latitude:spots_latitude,
      longitude:spots_longitude,
      created_at,
      prefecture:prefectures!inner(id, name, region),
      spot_flowers!left(flower:flowers(name))
    `,
    )
    .eq('is_published', true)
    .is('deleted_at', null)
    // embedded resource にも deleted_at フィルタ。spot_flowers / flowers の RLS でも防げるが
    // CLAUDE.md「全クエリで deleted_at IS NULL 必須」に揃える
    .filter('spot_flowers.deleted_at', 'is', null);

  if (params.prefecture) {
    query = query.eq('prefecture_id', params.prefecture);
  } else if (params.region) {
    query = query.eq('prefectures.region', params.region);
  }

  if (params.q) {
    const term = escapeIlike(params.q);
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (flowerId) {
    // spot_flowers との inner join に切り替えて flower_id で絞る
    query = supabase
      .from('spots')
      .select(
        `
        id,
        name,
        best_season_start,
        best_season_end,
        latitude:spots_latitude,
        longitude:spots_longitude,
        created_at,
        prefecture:prefectures!inner(id, name, region),
        spot_flowers:spot_flowers!inner(flower:flowers(name))
      `,
      )
      .eq('is_published', true)
      .is('deleted_at', null)
      .eq('spot_flowers.flower_id', flowerId)
      .filter('spot_flowers.deleted_at', 'is', null);

    if (params.prefecture) query = query.eq('prefecture_id', params.prefecture);
    else if (params.region) query = query.eq('prefectures.region', params.region);
    if (params.q) {
      const term = escapeIlike(params.q);
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  // ソート
  switch (params.sort) {
    case 'name':
      query = query
        .order('name_kana', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });
      break;
    case 'prefecture':
      query = query.order('prefecture_id', { ascending: true }).order('name', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error) {
    console.error('[searchSpots] query failed', error);
    return emptyPage(page);
  }

  const rows = (data ?? []) as unknown as RawSpot[];

  // 月またぎ判定の JS フィルタ
  const monthFiltered = params.month
    ? rows.filter((r) => isInBestSeason(r.best_season_start, r.best_season_end, params.month!))
    : rows;

  const totalCount = monthFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / SPOTS_PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * SPOTS_PAGE_SIZE;
  const sliced = monthFiltered.slice(start, start + SPOTS_PAGE_SIZE);

  // カバー画像をまとめて取得
  const ids = sliced.map((r) => r.id);
  const coverByOwner = new Map<string, string>();
  if (ids.length > 0) {
    const { data: images, error: imgError } = await supabase
      .from('images')
      .select('owner_id, url, display_order')
      .eq('owner_type', 'spot')
      .in('owner_id', ids)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });
    if (imgError) console.error('[searchSpots] failed to fetch images', imgError);
    for (const img of images ?? []) {
      if (!coverByOwner.has(img.owner_id)) coverByOwner.set(img.owner_id, img.url);
    }
  }

  const items: SpotSearchResult[] = sliced.map((r) => {
    const prefecture = Array.isArray(r.prefecture) ? r.prefecture[0] : r.prefecture;
    const flowerNames = (r.spot_flowers ?? [])
      .map((sf) => (Array.isArray(sf.flower) ? sf.flower[0]?.name : sf.flower?.name))
      .filter((n): n is string => !!n);
    return {
      id: r.id,
      name: r.name,
      prefectureName: prefecture?.name ?? '',
      region: prefecture?.region ?? '',
      bestSeasonStart: r.best_season_start,
      bestSeasonEnd: r.best_season_end,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      coverImageUrl: coverByOwner.get(r.id) ?? null,
      flowerNames,
    };
  });

  return {
    items,
    totalBeforeMonthFilter: rows.length,
    totalCount,
    page: pageClamped,
    pageSize: SPOTS_PAGE_SIZE,
    totalPages,
  };
}

type RawSpot = {
  id: string;
  name: string;
  best_season_start: number;
  best_season_end: number;
  latitude: number | null;
  longitude: number | null;
  prefecture:
    | { id: number; name: string; region: string }
    | { id: number; name: string; region: string }[]
    | null;
  spot_flowers: { flower: { name: string } | { name: string }[] | null }[] | null;
};

function emptyPage(page: number): SpotSearchPage {
  return {
    items: [],
    totalBeforeMonthFilter: 0,
    totalCount: 0,
    page,
    pageSize: SPOTS_PAGE_SIZE,
    totalPages: 1,
  };
}

function escapeIlike(s: string): string {
  // Supabase の `or` 内で使うため、`,` と `)` を予防的にエスケープ
  return s.replace(/[%_,()\\]/g, (c) => '\\' + c);
}

/**
 * フィルタ UI 用に都道府県・花のマスターを取得する。region でグループ化済みで返す。
 */
export type PrefectureGroup = {
  region: string;
  prefectures: { id: number; name: string }[];
};

export async function getPrefectureGroups(): Promise<PrefectureGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prefectures')
    .select('id, name, region, display_order')
    .order('display_order', { ascending: true });
  if (error || !data) {
    if (error) console.error('[getPrefectureGroups] failed', error);
    return [];
  }
  const groups = new Map<string, { id: number; name: string }[]>();
  for (const p of data) {
    const list = groups.get(p.region) ?? [];
    list.push({ id: p.id, name: p.name });
    groups.set(p.region, list);
  }
  return Array.from(groups.entries()).map(([region, prefectures]) => ({ region, prefectures }));
}

export async function getFlowerOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flowers')
    .select('id, name')
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) {
    console.error('[getFlowerOptions] failed', error);
    return [];
  }
  return data ?? [];
}
