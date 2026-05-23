import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { tokyoMonthStartIso } from '@/lib/utils/dateUtils';

/**
 * 管理画面用クエリ。`admin` 系画面・API は RLS をバイパスする必要があるため、
 * Service Role を使う前提で書いている。呼び出し側は **必ず `requireAdmin()` を先に通す**こと。
 */

export type AdminDashboardStats = {
  pendingSpots: number;
  aiUsageThisMonth: number;
  recentDeletedReviews: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = createAdminClient();

  // monthStart は JST の今月 1 日 00:00。Vercel UTC ランタイムでも JST 基準で集計する。
  // sevenDaysAgo は絶対 7 日間なのでタイムゾーンに依存しない。
  const monthStart = tokyoMonthStartIso();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [pendingRes, aiRes, deletedReviewRes] = await Promise.all([
    admin
      .from('spots')
      .select('id', { head: true, count: 'exact' })
      .eq('is_published', false)
      .is('deleted_at', null),
    admin
      .from('ai_usage_logs')
      .select('id', { head: true, count: 'exact' })
      .gte('used_at', monthStart)
      .is('deleted_at', null),
    admin
      .from('reviews')
      .select('id', { head: true, count: 'exact' })
      .gte('deleted_at', sevenDaysAgo)
      .not('deleted_at', 'is', null),
  ]);

  if (pendingRes.error) console.error('[getAdminDashboardStats] pendingSpots', pendingRes.error);
  if (aiRes.error) console.error('[getAdminDashboardStats] aiUsageThisMonth', aiRes.error);
  if (deletedReviewRes.error)
    console.error('[getAdminDashboardStats] recentDeletedReviews', deletedReviewRes.error);

  return {
    pendingSpots: pendingRes.count ?? 0,
    aiUsageThisMonth: aiRes.count ?? 0,
    recentDeletedReviews: deletedReviewRes.count ?? 0,
  };
}

export type AdminSpotRow = {
  id: string;
  name: string;
  prefectureId: number;
  prefectureName: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  isPublished: boolean;
  updatedAt: string;
};

export type AdminSpotListParams = {
  status?: 'all' | 'published' | 'unpublished';
  prefectureId?: number;
  q?: string;
};

export async function listAdminSpots(params: AdminSpotListParams): Promise<AdminSpotRow[]> {
  const admin = createAdminClient();

  let query = admin
    .from('spots')
    .select(
      `
      id,
      name,
      prefecture_id,
      best_season_start,
      best_season_end,
      is_published,
      updated_at,
      prefecture:prefectures(name)
    `,
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (params.status === 'published') query = query.eq('is_published', true);
  else if (params.status === 'unpublished') query = query.eq('is_published', false);

  if (params.prefectureId) query = query.eq('prefecture_id', params.prefectureId);

  if (params.q) {
    const term = params.q.replace(/[%_,()\\]/g, (c) => '\\' + c);
    query = query.or(`name.ilike.%${term}%,location.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[listAdminSpots] failed', error);
    return [];
  }

  type Row = {
    id: string;
    name: string;
    prefecture_id: number;
    best_season_start: number;
    best_season_end: number;
    is_published: boolean;
    updated_at: string;
    prefecture: { name: string } | { name: string }[] | null;
  };

  return (data as unknown as Row[]).map((r) => {
    const pref = Array.isArray(r.prefecture) ? r.prefecture[0] : r.prefecture;
    return {
      id: r.id,
      name: r.name,
      prefectureId: r.prefecture_id,
      prefectureName: pref?.name ?? '',
      bestSeasonStart: r.best_season_start,
      bestSeasonEnd: r.best_season_end,
      isPublished: r.is_published,
      updatedAt: r.updated_at,
    };
  });
}

export type AdminPendingSpot = {
  id: string;
  name: string;
  prefectureName: string;
  location: string;
  officialUrl: string | null;
  source: string | null;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  updatedAt: string;
};

export async function listPendingSpots(): Promise<AdminPendingSpot[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('spots')
    .select(
      `
      id, name, location, official_url, source,
      best_season_start, best_season_end, updated_at,
      prefecture:prefectures(name)
    `,
    )
    .eq('is_published', false)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[listPendingSpots] failed', error);
    return [];
  }

  type Row = {
    id: string;
    name: string;
    location: string;
    official_url: string | null;
    source: string | null;
    best_season_start: number;
    best_season_end: number;
    updated_at: string;
    prefecture: { name: string } | { name: string }[] | null;
  };

  return (data as unknown as Row[]).map((r) => {
    const pref = Array.isArray(r.prefecture) ? r.prefecture[0] : r.prefecture;
    return {
      id: r.id,
      name: r.name,
      prefectureName: pref?.name ?? '',
      location: r.location,
      officialUrl: r.official_url,
      source: r.source,
      bestSeasonStart: r.best_season_start,
      bestSeasonEnd: r.best_season_end,
      updatedAt: r.updated_at,
    };
  });
}

export type AdminSpotDetail = {
  id: string;
  name: string;
  nameKana: string | null;
  description: string | null;
  prefectureId: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  officialUrl: string | null;
  source: string | null;
  accessInfo: string | null;
  parkingInfo: string | null;
  entranceFee: string | null;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  isPublished: boolean;
  updatedAt: string;
  images: { id: string; url: string; caption: string | null; displayOrder: number }[];
  flowers: {
    flowerId: string;
    flowerName: string;
    bloomStartMonth: number | null;
    bloomEndMonth: number | null;
  }[];
};

export async function getAdminSpotDetail(id: string): Promise<AdminSpotDetail | null> {
  const admin = createAdminClient();

  const { data: spotRow, error } = await admin
    .from('spots')
    .select(
      `
      id, name, name_kana, description, prefecture_id, location,
      latitude:spots_latitude, longitude:spots_longitude,
      official_url, source, access_info, parking_info, entrance_fee,
      best_season_start, best_season_end, is_published, updated_at
    `,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[getAdminSpotDetail] failed', error);
    return null;
  }
  if (!spotRow) return null;

  type Row = {
    id: string;
    name: string;
    name_kana: string | null;
    description: string | null;
    prefecture_id: number;
    location: string;
    latitude: number | null;
    longitude: number | null;
    official_url: string | null;
    source: string | null;
    access_info: string | null;
    parking_info: string | null;
    entrance_fee: string | null;
    best_season_start: number;
    best_season_end: number;
    is_published: boolean;
    updated_at: string;
  };
  const row = spotRow as unknown as Row;

  const [imagesRes, flowersRes] = await Promise.all([
    admin
      .from('images')
      .select('id, url, caption, display_order')
      .eq('owner_type', 'spot')
      .eq('owner_id', id)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),
    admin
      .from('spot_flowers')
      .select('flower_id, bloom_start_month, bloom_end_month, flower:flowers!inner(id, name)')
      .eq('spot_id', id)
      .is('deleted_at', null)
      .is('flower.deleted_at', null),
  ]);

  type FlowerRow = {
    flower_id: string;
    bloom_start_month: number | null;
    bloom_end_month: number | null;
    flower: { id: string; name: string } | { id: string; name: string }[] | null;
  };

  const flowers = ((flowersRes.data as unknown as FlowerRow[] | null) ?? [])
    .map((f) => {
      const flower = Array.isArray(f.flower) ? f.flower[0] : f.flower;
      if (!flower) return null;
      return {
        flowerId: flower.id,
        flowerName: flower.name,
        bloomStartMonth: f.bloom_start_month,
        bloomEndMonth: f.bloom_end_month,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return {
    id: row.id,
    name: row.name,
    nameKana: row.name_kana,
    description: row.description,
    prefectureId: row.prefecture_id,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    officialUrl: row.official_url,
    source: row.source,
    accessInfo: row.access_info,
    parkingInfo: row.parking_info,
    entranceFee: row.entrance_fee,
    bestSeasonStart: row.best_season_start,
    bestSeasonEnd: row.best_season_end,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
    images: (imagesRes.data ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      displayOrder: img.display_order,
    })),
    flowers,
  };
}

export type AdminFlowerRow = {
  id: string;
  name: string;
  nameKana: string | null;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  aliases: string[];
  spotCount: number;
  updatedAt: string;
};

export type AdminFlowerListParams = {
  q?: string;
};

/**
 * 管理画面の花マスター一覧。`q` が指定された場合は flowers.name / name_kana の部分一致 +
 * flower_aliases.alias の部分一致のヒット集合（OR）で絞り込む。alias 検索は別クエリで
 * flower_id 集合を引いてからメインクエリで `in()` する 2 段構成（リレーション越しの
 * ilike が Supabase クライアントでは表現しづらいため）。
 */
export async function listAdminFlowers(params: AdminFlowerListParams): Promise<AdminFlowerRow[]> {
  const admin = createAdminClient();

  let flowerIdsFromAlias: Set<string> | null = null;
  if (params.q) {
    const term = params.q.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%_,()\\]/g, (c) => '\\' + c);
      const { data: aliasRows, error: aliasError } = await admin
        .from('flower_aliases')
        .select('flower_id')
        .ilike('alias', `%${escaped}%`)
        .is('deleted_at', null)
        .limit(500);
      if (aliasError) {
        console.error('[listAdminFlowers] alias search failed', aliasError);
      } else {
        flowerIdsFromAlias = new Set((aliasRows ?? []).map((r) => r.flower_id as string));
      }
    }
  }

  let query = admin
    .from('flowers')
    .select(
      `
      id, name, name_kana,
      default_season_start, default_season_end, updated_at
    `,
    )
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .limit(500);

  if (params.q) {
    const escaped = params.q.replace(/[%_,()\\]/g, (c) => '\\' + c);
    const idFilter =
      flowerIdsFromAlias && flowerIdsFromAlias.size > 0
        ? `,id.in.(${[...flowerIdsFromAlias].join(',')})`
        : '';
    query = query.or(`name.ilike.%${escaped}%,name_kana.ilike.%${escaped}%${idFilter}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[listAdminFlowers] failed', error);
    return [];
  }

  type Row = {
    id: string;
    name: string;
    name_kana: string | null;
    default_season_start: number | null;
    default_season_end: number | null;
    updated_at: string;
  };

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // alias / spot_flowers のカウントは別クエリでまとめて取って Map にする
  const [aliasRes, sfRes] = await Promise.all([
    admin
      .from('flower_aliases')
      .select('flower_id, alias')
      .in('flower_id', ids)
      .is('deleted_at', null)
      .order('alias', { ascending: true }),
    admin.from('spot_flowers').select('flower_id').in('flower_id', ids).is('deleted_at', null),
  ]);

  if (aliasRes.error) console.error('[listAdminFlowers] aliases', aliasRes.error);
  if (sfRes.error) console.error('[listAdminFlowers] spot_flowers', sfRes.error);

  const aliasMap = new Map<string, string[]>();
  for (const row of aliasRes.data ?? []) {
    const list = aliasMap.get(row.flower_id as string) ?? [];
    list.push(row.alias as string);
    aliasMap.set(row.flower_id as string, list);
  }

  const spotCountMap = new Map<string, number>();
  for (const row of sfRes.data ?? []) {
    const key = row.flower_id as string;
    spotCountMap.set(key, (spotCountMap.get(key) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    nameKana: r.name_kana,
    defaultSeasonStart: r.default_season_start,
    defaultSeasonEnd: r.default_season_end,
    aliases: aliasMap.get(r.id) ?? [],
    spotCount: spotCountMap.get(r.id) ?? 0,
    updatedAt: r.updated_at,
  }));
}

export type AdminFlowerDetail = {
  id: string;
  name: string;
  nameKana: string | null;
  description: string | null;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  updatedAt: string;
  images: { id: string; url: string; caption: string | null; displayOrder: number }[];
  aliases: { id: string; alias: string }[];
  relatedSpots: { id: string; name: string; prefectureName: string }[];
};

export async function getAdminFlowerDetail(id: string): Promise<AdminFlowerDetail | null> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from('flowers')
    .select(
      `
      id, name, name_kana, description,
      default_season_start, default_season_end, updated_at
    `,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[getAdminFlowerDetail] failed', error);
    return null;
  }
  if (!row) return null;

  type FlowerRow = {
    id: string;
    name: string;
    name_kana: string | null;
    description: string | null;
    default_season_start: number | null;
    default_season_end: number | null;
    updated_at: string;
  };
  const flower = row as FlowerRow;

  const [imagesRes, aliasesRes, spotsRes] = await Promise.all([
    admin
      .from('images')
      .select('id, url, caption, display_order')
      .eq('owner_type', 'flower')
      .eq('owner_id', id)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),
    admin
      .from('flower_aliases')
      .select('id, alias')
      .eq('flower_id', id)
      .is('deleted_at', null)
      .order('alias', { ascending: true }),
    admin
      .from('spot_flowers')
      .select('spot:spots!inner(id, name, prefecture:prefectures(name), deleted_at)')
      .eq('flower_id', id)
      .is('deleted_at', null)
      .is('spot.deleted_at', null),
  ]);

  type RelatedRow = {
    spot:
      | {
          id: string;
          name: string;
          prefecture: { name: string } | { name: string }[] | null;
          deleted_at: string | null;
        }
      | {
          id: string;
          name: string;
          prefecture: { name: string } | { name: string }[] | null;
          deleted_at: string | null;
        }[]
      | null;
  };

  const relatedSpots = ((spotsRes.data as unknown as RelatedRow[] | null) ?? [])
    .map((r) => {
      const spot = Array.isArray(r.spot) ? r.spot[0] : r.spot;
      if (!spot || spot.deleted_at) return null;
      const pref = Array.isArray(spot.prefecture) ? spot.prefecture[0] : spot.prefecture;
      return {
        id: spot.id,
        name: spot.name,
        prefectureName: pref?.name ?? '',
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    id: flower.id,
    name: flower.name,
    nameKana: flower.name_kana,
    description: flower.description,
    defaultSeasonStart: flower.default_season_start,
    defaultSeasonEnd: flower.default_season_end,
    updatedAt: flower.updated_at,
    images: (imagesRes.data ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      displayOrder: img.display_order,
    })),
    aliases: (aliasesRes.data ?? []).map((a) => ({ id: a.id, alias: a.alias })),
    relatedSpots,
  };
}

export type AdminImageRow = {
  id: string;
  ownerType: 'spot' | 'flower';
  ownerId: string;
  url: string;
  caption: string | null;
  displayOrder: number;
  ownerName: string | null;
  updatedAt: string;
};

export type AdminImageListParams = {
  ownerType?: 'spot' | 'flower' | 'all';
  limit?: number;
  offset?: number;
};

/**
 * `/admin/images` 用の全画像横断一覧。owner_type で絞り込み、ページングを支援する。
 * 親（spots / flowers）の名前は別クエリで引いて Map にして付ける（多態関連のため JOIN 不可）。
 */
export async function listAllImages(
  params: AdminImageListParams,
): Promise<{ rows: AdminImageRow[]; total: number }> {
  const admin = createAdminClient();

  const limit = params.limit ?? 60;
  const offset = params.offset ?? 0;

  let query = admin
    .from('images')
    .select('id, owner_type, owner_id, url, caption, display_order, updated_at', {
      count: 'exact',
    })
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.ownerType && params.ownerType !== 'all') {
    query = query.eq('owner_type', params.ownerType);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[listAllImages] failed', error);
    return { rows: [], total: 0 };
  }

  type Row = {
    id: string;
    owner_type: 'spot' | 'flower';
    owner_id: string;
    url: string;
    caption: string | null;
    display_order: number;
    updated_at: string;
  };
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return { rows: [], total: count ?? 0 };

  // 親の名前を別クエリで一括取得
  const spotIds = rows.filter((r) => r.owner_type === 'spot').map((r) => r.owner_id);
  const flowerIds = rows.filter((r) => r.owner_type === 'flower').map((r) => r.owner_id);

  const [spotRes, flowerRes] = await Promise.all([
    spotIds.length > 0
      ? admin.from('spots').select('id, name, deleted_at').in('id', spotIds)
      : Promise.resolve({ data: [] as { id: string; name: string; deleted_at: string | null }[] }),
    flowerIds.length > 0
      ? admin.from('flowers').select('id, name, deleted_at').in('id', flowerIds)
      : Promise.resolve({ data: [] as { id: string; name: string; deleted_at: string | null }[] }),
  ]);

  const ownerNameMap = new Map<string, string | null>();
  for (const s of spotRes.data ?? []) {
    ownerNameMap.set(`spot:${s.id}`, s.deleted_at ? null : s.name);
  }
  for (const f of flowerRes.data ?? []) {
    ownerNameMap.set(`flower:${f.id}`, f.deleted_at ? null : f.name);
  }

  return {
    rows: rows.map((r) => ({
      id: r.id,
      ownerType: r.owner_type,
      ownerId: r.owner_id,
      url: r.url,
      caption: r.caption,
      displayOrder: r.display_order,
      ownerName: ownerNameMap.get(`${r.owner_type}:${r.owner_id}`) ?? null,
      updatedAt: r.updated_at,
    })),
    total: count ?? 0,
  };
}

export type FlowerOption = { id: string; name: string };

export async function listAllFlowers(): Promise<FlowerOption[]> {
  // Service Role 不要だが、admin 系の他クエリと粒度を揃えて Service Role で取得する。
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('flowers')
    .select('id, name')
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) {
    console.error('[listAllFlowers] failed', error);
    return [];
  }
  return data ?? [];
}

export type PrefectureOption = { id: number; name: string; region: string };

export async function listPrefectures(): Promise<PrefectureOption[]> {
  // RLS は prefectures に無いので authenticated でも取れるが、UI 側で同じ admin
  // モジュールから呼ぶときに createClient/createAdminClient を混ぜると煩雑なので統一する。
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prefectures')
    .select('id, name, region')
    .order('display_order', { ascending: true });
  if (error) {
    console.error('[listPrefectures] failed', error);
    return [];
  }
  return data ?? [];
}
