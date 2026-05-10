import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 引数で受け取った Supabase クライアントの現在ログイン中ユーザーが
 * 退会済み（profiles.deleted_at IS NOT NULL）かどうかを判定する。
 *
 * 退会済みなら `signOut()` してセッションを破棄し、`true` を返す。
 * 呼び出し側は `true` ならエラー付きでリダイレクト等するだけでよい。
 *
 * 認証直後の login Server Action / OAuth callback から呼ぶ前提。
 * profiles の SELECT RLS は `USING (true)` なので auth ユーザーから読める。
 */
export async function isCurrentUserWithdrawn(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.deleted_at) {
    await supabase.auth.signOut();
    return true;
  }
  return false;
}
