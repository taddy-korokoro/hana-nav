import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/get-user';
import type { User } from '@supabase/supabase-js';

/**
 * Server Component / Server Action / Route Handler から呼び、未ログインなら
 * /auth/login にリダイレクトしてログイン済みユーザーを返す。
 *
 * `getCurrentUser()`（`React.cache` 済み）経由なので、同一リクエスト内で
 * layout の認証ゲートと各 page が両方 `requireUser()` を呼んでも Auth サーバー
 * への往復は 1 回にまとまる。`requireAdmin()` と同じ構造。
 *
 * Cookie は user が改ざん可能なため、内部で必ず getUser() で Auth サーバーに
 * JWT 検証を投げる（getSession() は使わない）。
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  return user;
}
