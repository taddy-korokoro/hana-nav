import { createAdminClient } from '@/lib/supabase/admin';
import { containsNgWord } from '@/lib/ng-words';

/**
 * `/admin/reviews` 用クエリと論理削除 / 復元アクション。Service Role を使うので
 * 呼び出し側で `requireAdmin()` を必ず通すこと。
 *
 * `reviews.user_id` は `auth.users(id)` を参照しており、PostgREST が `profiles`
 * へのリレーションを推論できないため、ユーザー名は `profiles` を別クエリで取得して
 * JS 側で merge する（admin-users.ts と同じパターン）。
 */

export type AdminReviewRow = {
  id: string;
  spotId: string;
  spotName: string;
  userId: string | null;
  username: string | null;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
  createdAt: string;
  isDeleted: boolean;
  containsNg: boolean;
  authorWithdrawn: boolean;
};

export type AdminReviewListParams = {
  status?: 'all' | 'active' | 'deleted';
  ngOnly?: boolean;
  q?: string;
};

type ReviewRow = {
  id: string;
  spot_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  visited_at: string | null;
  created_at: string;
  deleted_at: string | null;
  spot: { name: string } | { name: string }[] | null;
};

const REVIEW_SELECT = `
  id, spot_id, user_id, rating, comment, visited_at, created_at, deleted_at,
  spot:spots(name)
`;

export async function listAdminReviews(params: AdminReviewListParams): Promise<AdminReviewRow[]> {
  const admin = createAdminClient();

  let query = admin
    .from('reviews')
    .select(REVIEW_SELECT)
    .order('created_at', { ascending: false })
    .limit(300);

  if (params.status === 'active') {
    query = query.is('deleted_at', null);
  } else if (params.status === 'deleted') {
    query = query.not('deleted_at', 'is', null);
  }

  if (params.q) {
    const term = params.q.replace(/[%_,()\\]/g, (c) => '\\' + c);
    query = query.ilike('comment', `%${term}%`);
  }

  const initialRes = await query;
  if (initialRes.error) {
    console.error('[listAdminReviews] failed', initialRes.error.message ?? initialRes.error);
    return [];
  }
  let dataRows: ReviewRow[] = (initialRes.data as unknown as ReviewRow[]) ?? [];

  // 検索が指定されている場合は、スポット名 / ユーザー名にヒットするレビューも
  // 別フェッチで補完する（本文 ilike では当たらないため）。
  if (params.q) {
    const term = params.q.replace(/[%_,()\\]/g, (c) => '\\' + c);

    const [spotMatchRes, profileMatchRes] = await Promise.all([
      admin.from('spots').select('id').ilike('name', `%${term}%`).is('deleted_at', null).limit(200),
      admin.from('profiles').select('id').ilike('username', `%${term}%`).limit(200),
    ]);

    const spotIds = (spotMatchRes.data ?? []).map((r) => r.id as string);
    const userIds = (profileMatchRes.data ?? []).map((r) => r.id as string);

    if (spotIds.length > 0 || userIds.length > 0) {
      let fallback = admin
        .from('reviews')
        .select(REVIEW_SELECT)
        .order('created_at', { ascending: false })
        .limit(300);

      if (params.status === 'active') fallback = fallback.is('deleted_at', null);
      else if (params.status === 'deleted') fallback = fallback.not('deleted_at', 'is', null);

      const orParts: string[] = [];
      if (spotIds.length > 0) orParts.push(`spot_id.in.(${spotIds.join(',')})`);
      if (userIds.length > 0) orParts.push(`user_id.in.(${userIds.join(',')})`);
      fallback = fallback.or(orParts.join(','));

      const fallbackRes = await fallback;
      if (fallbackRes.error) {
        console.error(
          '[listAdminReviews] fallback failed',
          fallbackRes.error.message ?? fallbackRes.error,
        );
      } else {
        const existingIds = new Set(dataRows.map((r) => r.id));
        const fbRows = (fallbackRes.data as unknown as ReviewRow[]) ?? [];
        dataRows = [...dataRows, ...fbRows.filter((r) => !existingIds.has(r.id))];
      }
    }
  }

  // ユーザー名・退会状態は profiles を別クエリで引いて Map にする。
  const userIdSet = new Set<string>();
  for (const r of dataRows) {
    if (r.user_id) userIdSet.add(r.user_id);
  }

  const profileMap = new Map<string, { username: string | null; deletedAt: string | null }>();
  if (userIdSet.size > 0) {
    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .select('id, username, deleted_at')
      .in('id', [...userIdSet]);
    if (profileError) {
      console.error(
        '[listAdminReviews] profile fetch failed',
        profileError.message ?? profileError,
      );
    } else {
      for (const p of (profileData ?? []) as {
        id: string;
        username: string | null;
        deleted_at: string | null;
      }[]) {
        profileMap.set(p.id, { username: p.username, deletedAt: p.deleted_at });
      }
    }
  }

  let rows = dataRows.map((r) => {
    const spot = Array.isArray(r.spot) ? r.spot[0] : r.spot;
    const profile = r.user_id ? profileMap.get(r.user_id) : undefined;
    const comment = r.comment ?? '';
    return {
      id: r.id,
      spotId: r.spot_id,
      spotName: spot?.name ?? '',
      userId: r.user_id,
      username: profile?.username ?? null,
      rating: r.rating,
      comment: r.comment,
      visitedAt: r.visited_at,
      createdAt: r.created_at,
      isDeleted: r.deleted_at != null,
      containsNg: containsNgWord(comment),
      authorWithdrawn: profile?.deletedAt != null,
    } satisfies AdminReviewRow;
  });

  if (params.ngOnly) {
    rows = rows.filter((r) => r.containsNg);
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return rows;
}

export type SoftDeleteReviewResult =
  | { ok: true }
  | { ok: false; error: { code: 'not_found' | 'delete_failed' } };

export async function softDeleteReviewAdmin(reviewId: string): Promise<SoftDeleteReviewResult> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from('reviews')
    .select('id')
    .eq('id', reviewId)
    .maybeSingle();
  if (existingError || !existing) {
    return { ok: false, error: { code: 'not_found' } };
  }

  const { error } = await admin
    .from('reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reviewId);
  if (error) {
    console.error('[softDeleteReviewAdmin] failed', error.message ?? error);
    return { ok: false, error: { code: 'delete_failed' } };
  }
  return { ok: true };
}

export async function restoreReviewAdmin(reviewId: string): Promise<SoftDeleteReviewResult> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from('reviews')
    .select('id')
    .eq('id', reviewId)
    .maybeSingle();
  if (existingError || !existing) {
    return { ok: false, error: { code: 'not_found' } };
  }

  const { error } = await admin.from('reviews').update({ deleted_at: null }).eq('id', reviewId);
  if (error) {
    console.error('[restoreReviewAdmin] failed', error.message ?? error);
    return { ok: false, error: { code: 'delete_failed' } };
  }
  return { ok: true };
}
