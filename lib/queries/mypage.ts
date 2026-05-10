import { createClient } from '@/lib/supabase/server';

export type MyProfile = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
};

export type MyMypageStats = {
  bookmarkCount: number;
  reviewCount: number;
};

/**
 * マイページ TOP のヘッダー表示に必要な profiles の項目だけを取り出す。
 * RLS により他人の行には触れないため、`auth.uid()` ベースで安全。
 * 該当する profile が存在しない（trigger 失敗等の異常）場合は null を返し、
 * 呼び出し側で notFound() / 再ログイン誘導を判断する。
 */
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(`[getMyProfile] ${error.message}`);
  }
  if (!data) return null;

  const role = data.role === 'admin' ? 'admin' : 'user';
  return {
    id: data.id,
    username: data.username,
    avatarUrl: data.avatar_url,
    role,
  };
}

/**
 * マイページ TOP のサマリー（ブックマーク件数 / レビュー件数）。
 * `head: true` で件数だけを取得するため、行データは転送されない。
 */
export async function getMyMypageStats(userId: string): Promise<MyMypageStats> {
  const supabase = await createClient();

  const [bookmarksRes, reviewsRes] = await Promise.all([
    supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
  ]);

  if (bookmarksRes.error) {
    throw new Error(`[getMyMypageStats:bookmarks] ${bookmarksRes.error.message}`);
  }
  if (reviewsRes.error) {
    throw new Error(`[getMyMypageStats:reviews] ${reviewsRes.error.message}`);
  }

  return {
    bookmarkCount: bookmarksRes.count ?? 0,
    reviewCount: reviewsRes.count ?? 0,
  };
}
