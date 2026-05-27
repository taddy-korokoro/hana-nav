import { createAnonClient } from '@/lib/supabase/anon';

export type SpotDetail = {
  id: string;
  name: string;
  nameKana: string | null;
  description: string | null;
  prefectureId: number;
  prefectureName: string;
  prefectureRegion: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  officialUrl: string | null;
  accessInfo: string | null;
  parkingInfo: string | null;
  entranceFee: string | null;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  source: string | null;
  updatedAt: string;
};

export type SpotImage = {
  id: string;
  url: string;
  caption: string | null;
  displayOrder: number;
};

export type SpotFlowerEntry = {
  flowerId: string;
  flowerName: string;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  bloomStartMonth: number | null;
  bloomEndMonth: number | null;
};

export type SpotReview = {
  id: string;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
  createdAt: string;
  /** profile が null（=退会済 or RLS で読めない）の場合は「退会済ユーザー」表示 */
  reviewer: { username: string | null; avatarUrl: string | null } | null;
};

export type RelatedSpot = {
  id: string;
  name: string;
  prefectureName: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  coverImageUrl: string | null;
  coverImageCaption: string | null;
  reason: 'prefecture' | 'flower';
};

export type SpotDetailBundle = {
  spot: SpotDetail;
  images: SpotImage[];
  flowers: SpotFlowerEntry[];
  reviews: SpotReview[];
  reviewSummary: { count: number; average: number | null };
  relatedSpots: RelatedSpot[];
};

/**
 * スポット詳細ページに必要なデータを 1 関数で取得する。
 * 親レコード取得後、画像 / spot_flowers / レビュー / 関連スポットを `Promise.all` で並列化する。
 * 未公開・論理削除済みの場合は `null` を返し、呼び出し側で `notFound()` させる。
 */
export async function getSpotDetail(id: string): Promise<SpotDetailBundle | null> {
  const supabase = createAnonClient();

  const { data: spotRow, error } = await supabase
    .from('spots')
    .select(
      `
      id,
      name,
      name_kana,
      description,
      prefecture_id,
      location,
      latitude:spots_latitude,
      longitude:spots_longitude,
      official_url,
      access_info,
      parking_info,
      entrance_fee,
      best_season_start,
      best_season_end,
      source,
      updated_at,
      prefecture:prefectures(id, name, region)
    `,
    )
    .eq('id', id)
    .eq('is_published', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[getSpotDetail] failed to fetch spot', error);
    return null;
  }
  if (!spotRow) return null;

  const row = spotRow as unknown as {
    id: string;
    name: string;
    name_kana: string | null;
    description: string | null;
    prefecture_id: number;
    location: string;
    latitude: number | null;
    longitude: number | null;
    official_url: string | null;
    access_info: string | null;
    parking_info: string | null;
    entrance_fee: string | null;
    best_season_start: number;
    best_season_end: number;
    source: string | null;
    updated_at: string;
    prefecture:
      | { id: number; name: string; region: string }
      | { id: number; name: string; region: string }[]
      | null;
  };
  const prefecture = Array.isArray(row.prefecture) ? row.prefecture[0] : row.prefecture;

  const spot: SpotDetail = {
    id: row.id,
    name: row.name,
    nameKana: row.name_kana,
    description: row.description,
    prefectureId: row.prefecture_id,
    prefectureName: prefecture?.name ?? '',
    prefectureRegion: prefecture?.region ?? '',
    location: row.location,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    officialUrl: row.official_url,
    accessInfo: row.access_info,
    parkingInfo: row.parking_info,
    entranceFee: row.entrance_fee,
    bestSeasonStart: row.best_season_start,
    bestSeasonEnd: row.best_season_end,
    source: row.source,
    updatedAt: row.updated_at,
  };

  const [images, flowers, reviewsBundle] = await Promise.all([
    fetchImages(spot.id),
    fetchFlowers(spot.id),
    fetchReviews(spot.id),
  ]);

  const flowerIds = flowers.map((f) => f.flowerId);
  const relatedSpots = await fetchRelatedSpots({
    excludeId: spot.id,
    prefectureId: spot.prefectureId,
    flowerIds,
    limit: 4,
  });

  return {
    spot,
    images,
    flowers,
    reviews: reviewsBundle.reviews,
    reviewSummary: reviewsBundle.summary,
    relatedSpots,
  };
}

async function fetchImages(spotId: string): Promise<SpotImage[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('images')
    .select('id, url, caption, display_order')
    .eq('owner_type', 'spot')
    .eq('owner_id', spotId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getSpotDetail] failed to fetch images', error);
    return [];
  }
  return (data ?? []).map((img) => ({
    id: img.id,
    url: img.url,
    caption: img.caption,
    displayOrder: img.display_order,
  }));
}

async function fetchFlowers(spotId: string): Promise<SpotFlowerEntry[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('spot_flowers')
    .select(
      `
      bloom_start_month,
      bloom_end_month,
      flower:flowers!inner(id, name, default_season_start, default_season_end, deleted_at)
    `,
    )
    .eq('spot_id', spotId)
    .is('deleted_at', null)
    .is('flower.deleted_at', null);

  if (error) {
    console.error('[getSpotDetail] failed to fetch spot_flowers', error);
    return [];
  }

  type Row = {
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
  };

  return (data as unknown as Row[])
    .map((sf) => {
      const flower = Array.isArray(sf.flower) ? sf.flower[0] : sf.flower;
      if (!flower) return null;
      return {
        flowerId: flower.id,
        flowerName: flower.name,
        defaultSeasonStart: flower.default_season_start ?? null,
        defaultSeasonEnd: flower.default_season_end ?? null,
        bloomStartMonth: sf.bloom_start_month ?? null,
        bloomEndMonth: sf.bloom_end_month ?? null,
      } satisfies SpotFlowerEntry;
    })
    .filter((v): v is SpotFlowerEntry => v !== null);
}

async function fetchReviews(
  spotId: string,
): Promise<{ reviews: SpotReview[]; summary: { count: number; average: number | null } }> {
  const supabase = createAnonClient();
  // reviews.user_id は auth.users(id) を参照しており public.profiles への FK が無いので、
  // PostgREST の埋め込み（`reviewer:profiles(...)`）は relation を解決できず失敗する。
  // images と同じく別クエリで profiles を取得して手動でマージする。
  // 退会ユーザーは profiles の `.is('deleted_at', null)` で除外され、reviewer = null として
  // UI 側で「退会済ユーザー」表示に振り分ける。
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, rating, comment, visited_at, created_at')
    .eq('spot_id', spotId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[getSpotDetail] failed to fetch reviews', error);
    return { reviews: [], summary: { count: 0, average: null } };
  }

  type Row = {
    id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    visited_at: string | null;
    created_at: string;
  };

  const rows = (data as unknown as Row[] | null) ?? [];

  const profileMap = new Map<string, { username: string | null; avatarUrl: string | null }>();
  if (rows.length > 0) {
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)
      .is('deleted_at', null);

    if (profileError) {
      console.error('[getSpotDetail] failed to fetch reviewer profiles', profileError);
    } else {
      for (const p of profiles ?? []) {
        profileMap.set(p.id, { username: p.username, avatarUrl: p.avatar_url });
      }
    }
  }

  const reviews: SpotReview[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    visitedAt: r.visited_at,
    createdAt: r.created_at,
    reviewer: profileMap.get(r.user_id) ?? null,
  }));

  const count = reviews.length;
  const average =
    count > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : null;

  return { reviews, summary: { count, average } };
}

async function fetchRelatedSpots(args: {
  excludeId: string;
  prefectureId: number;
  flowerIds: string[];
  limit: number;
}): Promise<RelatedSpot[]> {
  const { excludeId, prefectureId, flowerIds, limit } = args;
  const supabase = createAnonClient();

  const collected = new Map<string, RelatedSpot>();

  const { data: byPref, error: prefError } = await supabase
    .from('spots')
    .select(
      `
      id, name, best_season_start, best_season_end,
      prefecture:prefectures(name)
    `,
    )
    .eq('prefecture_id', prefectureId)
    .eq('is_published', true)
    .is('deleted_at', null)
    .neq('id', excludeId)
    .limit(limit);

  if (prefError) {
    console.error('[getSpotDetail] failed to fetch related spots (prefecture)', prefError);
  }

  for (const s of (byPref ?? []) as unknown as Array<{
    id: string;
    name: string;
    best_season_start: number;
    best_season_end: number;
    prefecture: { name: string } | { name: string }[] | null;
  }>) {
    if (collected.size >= limit) break;
    const pref = Array.isArray(s.prefecture) ? s.prefecture[0] : s.prefecture;
    collected.set(s.id, {
      id: s.id,
      name: s.name,
      prefectureName: pref?.name ?? '',
      bestSeasonStart: s.best_season_start,
      bestSeasonEnd: s.best_season_end,
      coverImageUrl: null,
      coverImageCaption: null,
      reason: 'prefecture',
    });
  }

  if (collected.size < limit && flowerIds.length > 0) {
    const remaining = limit - collected.size;
    const excludeIds = [excludeId, ...collected.keys()];
    const { data: byFlower, error: flowerError } = await supabase
      .from('spot_flowers')
      .select(
        `
        spot:spots!inner(
          id, name, best_season_start, best_season_end, is_published, deleted_at,
          prefecture:prefectures(name)
        )
      `,
      )
      .in('flower_id', flowerIds)
      .is('deleted_at', null)
      .is('spot.deleted_at', null)
      .eq('spot.is_published', true)
      .not('spot_id', 'in', `(${excludeIds.map((v) => `"${v}"`).join(',')})`)
      .limit(remaining * 3);

    if (flowerError) {
      console.error('[getSpotDetail] failed to fetch related spots (flower)', flowerError);
    }

    type Row = {
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

    for (const r of (byFlower ?? []) as unknown as Row[]) {
      if (collected.size >= limit) break;
      const s = Array.isArray(r.spot) ? r.spot[0] : r.spot;
      if (!s || collected.has(s.id)) continue;
      const pref = Array.isArray(s.prefecture) ? s.prefecture[0] : s.prefecture;
      collected.set(s.id, {
        id: s.id,
        name: s.name,
        prefectureName: pref?.name ?? '',
        bestSeasonStart: s.best_season_start,
        bestSeasonEnd: s.best_season_end,
        coverImageUrl: null,
        coverImageCaption: null,
        reason: 'flower',
      });
    }
  }

  const ids = Array.from(collected.keys());
  if (ids.length === 0) return [];

  const { data: images, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, caption, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', ids)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (imgError) {
    console.error('[getSpotDetail] failed to fetch related spot images', imgError);
  }

  const coverByOwner = new Map<string, { url: string; caption: string | null }>();
  for (const img of images ?? []) {
    if (!coverByOwner.has(img.owner_id)) {
      coverByOwner.set(img.owner_id, { url: img.url, caption: img.caption ?? null });
    }
  }

  return ids.map((id) => {
    const entry = collected.get(id)!;
    return {
      ...entry,
      coverImageUrl: coverByOwner.get(id)?.url ?? null,
      coverImageCaption: coverByOwner.get(id)?.caption ?? null,
    };
  });
}

/**
 * `generateMetadata` 専用。詳細用と同じテーブルから最低限の情報のみ抜く軽量クエリ。
 * 本体の `getSpotDetail` を再利用すると重い join まで毎回走るので分けている。
 */
export async function getSpotMeta(id: string): Promise<{
  name: string;
  description: string | null;
  prefectureName: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  coverImageUrl: string | null;
} | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('spots')
    .select(
      `
      id, name, description, best_season_start, best_season_end,
      prefecture:prefectures(name)
    `,
    )
    .eq('id', id)
    .eq('is_published', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    name: string;
    description: string | null;
    best_season_start: number;
    best_season_end: number;
    prefecture: { name: string } | { name: string }[] | null;
  };
  const pref = Array.isArray(row.prefecture) ? row.prefecture[0] : row.prefecture;

  const { data: imageRow } = await supabase
    .from('images')
    .select('url, display_order')
    .eq('owner_type', 'spot')
    .eq('owner_id', row.id)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    name: row.name,
    description: row.description,
    prefectureName: pref?.name ?? '',
    bestSeasonStart: row.best_season_start,
    bestSeasonEnd: row.best_season_end,
    coverImageUrl: imageRow?.url ?? null,
  };
}
