import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Server Component / Server Action / Route Handler から呼び、admin ロール
 * でなければ `/` にリダイレクトする。未ログインの場合は middleware が先に
 * /auth/login へ捌くが、middleware 経路外（直接呼び出し）でも安全側に倒す。
 *
 * 戻り値は admin ユーザー本体。`profiles.role` を再取得したい場合は呼び出し
 * 元で別途 select する。
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return user;
}
