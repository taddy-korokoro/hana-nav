import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 管理画面のユーザー・レビュー・AI 利用関連クエリ。
 * 呼び出し側は **必ず `requireAdmin()` を先に通す** こと（Service Role を使うため）。
 *
 * auth.users から email を取得する必要があるが PostgREST では参照できないため、
 * `supabase.auth.admin.listUsers()` をページング呼び出しでまとめて引いて Map にする。
 * MVP では総ユーザー数が数百〜数千を想定しているため一括取得でも問題にならない。
 */

const AUTH_USERS_PAGE_SIZE = 200;
const AUTH_USERS_MAX_PAGES = 50; // 念のため上限。10,000 ユーザーまで対応。

export type AuthUserBrief = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

async function fetchAllAuthUsers(): Promise<Map<string, AuthUserBrief>> {
  const admin = createAdminClient();
  const map = new Map<string, AuthUserBrief>();

  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });
    if (error) {
      console.error('[fetchAllAuthUsers] failed', error);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) {
      map.set(u.id, {
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }
    if (users.length < AUTH_USERS_PAGE_SIZE) break;
  }

  return map;
}

async function fetchAuthUser(userId: string): Promise<AuthUserBrief | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    if (error) console.error('[fetchAuthUser] failed', error);
    return null;
  }
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    createdAt: data.user.created_at,
    lastSignInAt: data.user.last_sign_in_at ?? null,
  };
}

export type AdminUserRow = {
  id: string;
  username: string | null;
  email: string | null;
  role: 'user' | 'admin';
  isWithdrawn: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminUserListParams = {
  status?: 'all' | 'active' | 'withdrawn';
  role?: 'all' | 'user' | 'admin';
  q?: string;
};

export async function listAdminUsers(params: AdminUserListParams): Promise<AdminUserRow[]> {
  const admin = createAdminClient();

  const authUsers = await fetchAllAuthUsers();

  let query = admin
    .from('profiles')
    .select('id, username, role, created_at, updated_at, deleted_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (params.status === 'active') {
    query = query.is('deleted_at', null);
  } else if (params.status === 'withdrawn') {
    query = query.not('deleted_at', 'is', null);
  }

  if (params.role === 'user' || params.role === 'admin') {
    query = query.eq('role', params.role);
  }

  if (params.q) {
    const term = params.q.replace(/[%_,()\\]/g, (c) => '\\' + c);
    query = query.ilike('username', `%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[listAdminUsers] failed', error);
    return [];
  }

  type Row = {
    id: string;
    username: string | null;
    role: 'user' | 'admin' | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };

  const rows = (data ?? []) as Row[];

  let result: AdminUserRow[] = rows.map((r) => {
    const auth = authUsers.get(r.id);
    return {
      id: r.id,
      username: r.username,
      email: auth?.email ?? null,
      role: r.role === 'admin' ? 'admin' : 'user',
      isWithdrawn: r.deleted_at != null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at,
    };
  });

  // username で当たらなくても email が部分一致する場合は別途取り込む。
  if (params.q) {
    const lower = params.q.toLowerCase();
    const usernameHitIds = new Set(result.map((r) => r.id));

    // username にヒットしなかったユーザーで email 部分一致するもの
    const profilesByEmailHit: AdminUserRow[] = [];
    const candidates: { id: string; email: string }[] = [];
    for (const [id, u] of authUsers.entries()) {
      if (usernameHitIds.has(id)) continue;
      if (!u.email) continue;
      if (u.email.toLowerCase().includes(lower)) {
        candidates.push({ id, email: u.email });
      }
    }
    if (candidates.length > 0) {
      const ids = candidates.map((c) => c.id);
      let extraQuery = admin
        .from('profiles')
        .select('id, username, role, created_at, updated_at, deleted_at')
        .in('id', ids);

      if (params.status === 'active') extraQuery = extraQuery.is('deleted_at', null);
      else if (params.status === 'withdrawn') extraQuery = extraQuery.not('deleted_at', 'is', null);
      if (params.role === 'user' || params.role === 'admin')
        extraQuery = extraQuery.eq('role', params.role);

      const { data: extraData, error: extraError } = await extraQuery;
      if (extraError) {
        console.error('[listAdminUsers] email-hit fetch failed', extraError);
      } else {
        for (const r of (extraData ?? []) as Row[]) {
          const auth = authUsers.get(r.id);
          profilesByEmailHit.push({
            id: r.id,
            username: r.username,
            email: auth?.email ?? null,
            role: r.role === 'admin' ? 'admin' : 'user',
            isWithdrawn: r.deleted_at != null,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            deletedAt: r.deleted_at,
          });
        }
      }
    }

    if (profilesByEmailHit.length > 0) {
      result = [...result, ...profilesByEmailHit].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    }
  }

  return result;
}

export type AdminUserReviewRow = {
  id: string;
  spotId: string;
  spotName: string;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
  createdAt: string;
  isDeleted: boolean;
};

export type AdminUserBookmarkRow = {
  id: string;
  spotId: string;
  spotName: string | null;
  createdAt: string;
  isDeleted: boolean;
};

export type AdminUserAiUsageRow = {
  id: string;
  usedAt: string;
  rewardUnlocked: boolean;
  isAnonymous: boolean;
};

export type AdminUserDetail = {
  id: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  isWithdrawn: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  authCreatedAt: string | null;
  lastSignInAt: string | null;
  reviews: AdminUserReviewRow[];
  bookmarks: AdminUserBookmarkRow[];
  aiUsage: AdminUserAiUsageRow[];
  aiUsageTotal: number;
};

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, username, avatar_url, role, created_at, updated_at, deleted_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('[getAdminUserDetail] profile fetch failed', profileError);
    return null;
  }
  if (!profile) return null;

  const [authUser, reviewsRes, bookmarksRes, aiRes, aiCountRes] = await Promise.all([
    fetchAuthUser(userId),
    admin
      .from('reviews')
      .select('id, spot_id, rating, comment, visited_at, created_at, deleted_at, spot:spots(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('bookmarks')
      .select('id, spot_id, created_at, deleted_at, spot:spots(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('ai_usage_logs')
      .select('id, used_at, reward_unlocked, anonymous_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('used_at', { ascending: false })
      .limit(50),
    admin
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
  ]);

  if (reviewsRes.error) console.error('[getAdminUserDetail] reviews', reviewsRes.error);
  if (bookmarksRes.error) console.error('[getAdminUserDetail] bookmarks', bookmarksRes.error);
  if (aiRes.error) console.error('[getAdminUserDetail] ai_usage_logs', aiRes.error);
  if (aiCountRes.error) console.error('[getAdminUserDetail] ai_usage_logs count', aiCountRes.error);

  type ReviewRow = {
    id: string;
    spot_id: string;
    rating: number;
    comment: string | null;
    visited_at: string | null;
    created_at: string;
    deleted_at: string | null;
    spot: { name: string } | { name: string }[] | null;
  };
  type BookmarkRow = {
    id: string;
    spot_id: string;
    created_at: string;
    deleted_at: string | null;
    spot: { name: string } | { name: string }[] | null;
  };
  type AiRow = {
    id: string;
    used_at: string;
    reward_unlocked: boolean;
    anonymous_id: string | null;
  };

  const reviews: AdminUserReviewRow[] = ((reviewsRes.data as unknown as ReviewRow[]) ?? []).map(
    (r) => {
      const spot = Array.isArray(r.spot) ? r.spot[0] : r.spot;
      return {
        id: r.id,
        spotId: r.spot_id,
        spotName: spot?.name ?? '',
        rating: r.rating,
        comment: r.comment,
        visitedAt: r.visited_at,
        createdAt: r.created_at,
        isDeleted: r.deleted_at != null,
      };
    },
  );

  const bookmarks: AdminUserBookmarkRow[] = (
    (bookmarksRes.data as unknown as BookmarkRow[]) ?? []
  ).map((r) => {
    const spot = Array.isArray(r.spot) ? r.spot[0] : r.spot;
    return {
      id: r.id,
      spotId: r.spot_id,
      spotName: spot?.name ?? null,
      createdAt: r.created_at,
      isDeleted: r.deleted_at != null,
    };
  });

  const aiUsage: AdminUserAiUsageRow[] = ((aiRes.data as AiRow[] | null) ?? []).map((r) => ({
    id: r.id,
    usedAt: r.used_at,
    rewardUnlocked: r.reward_unlocked,
    isAnonymous: r.anonymous_id != null,
  }));

  return {
    id: profile.id,
    username: profile.username,
    email: authUser?.email ?? null,
    avatarUrl: profile.avatar_url,
    role: profile.role === 'admin' ? 'admin' : 'user',
    isWithdrawn: profile.deleted_at != null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    deletedAt: profile.deleted_at,
    authCreatedAt: authUser?.createdAt ?? null,
    lastSignInAt: authUser?.lastSignInAt ?? null,
    reviews,
    bookmarks,
    aiUsage,
    aiUsageTotal: aiCountRes.count ?? 0,
  };
}

export type UpdateUserPatch = {
  role?: 'user' | 'admin';
  deletedAt?: string | null;
};

export type UpdateUserResult =
  | { ok: true }
  | { ok: false; error: { code: 'not_found' | 'update_failed' | 'invalid_input' } };

export async function updateUserAdmin(
  userId: string,
  patch: UpdateUserPatch,
): Promise<UpdateUserResult> {
  if (!patch.role && patch.deletedAt === undefined) {
    return { ok: false, error: { code: 'invalid_input' } };
  }

  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (existingError || !existing) {
    return { ok: false, error: { code: 'not_found' } };
  }

  const update: { role?: string; deleted_at?: string | null } = {};
  if (patch.role) update.role = patch.role;
  if (patch.deletedAt !== undefined) update.deleted_at = patch.deletedAt;

  const { error } = await admin.from('profiles').update(update).eq('id', userId);
  if (error) {
    console.error('[updateUserAdmin] failed', error);
    return { ok: false, error: { code: 'update_failed' } };
  }
  return { ok: true };
}
