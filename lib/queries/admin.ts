import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
