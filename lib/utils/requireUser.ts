import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Server Component / Server Action / Route Handler から呼び、未ログインなら
 * /auth/login にリダイレクトしてログイン済みユーザーを返す。
 *
 * Cookie は user が改ざん可能なため、必ず getUser() で Auth サーバーに
 * JWT 検証を投げる（getSession() は使わない）。
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return user;
}
