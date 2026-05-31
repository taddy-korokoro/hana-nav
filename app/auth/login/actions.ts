'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { GUEST_ADMIN } from '@/lib/auth/guestAdmin';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserWithdrawn } from '@/lib/utils/checkWithdrawn';

/**
 * デモ用ゲスト管理者として、`lib/auth/guestAdmin.ts` の定数に保存された認証情報で
 * `signInWithPassword` する Server Action。
 *
 * - 一致した user は `isGuestAdmin()` 経由で識別され、書き込み系の Server Action /
 *   Route Handler は `requireWriteAdmin()` で 403 を返す
 * - 認証情報を平文で git に置く判断の根拠は `lib/auth/guestAdmin.ts` 冒頭コメント参照
 */
export async function loginAsGuestAdmin() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: GUEST_ADMIN.email,
    password: GUEST_ADMIN.password,
  });
  if (error) {
    console.error('[loginAsGuestAdmin] signIn failed', error.message);
    redirect('/auth/login?error=guest_signin_failed');
  }
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function login(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    redirect('/auth/login?error=invalid_input');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/auth/login?error=invalid_credentials');
  }

  // 退会済み（profiles.deleted_at IS NOT NULL）なら即サインアウトしてエラー表示。
  // auth.users 自体は残しているため signInWithPassword は成功してしまう。
  // 「退会済みです」と明示するとアカウントの存在を漏らすので、通常のログイン失敗と同じ
  // invalid_credentials にまとめる。
  if (await isCurrentUserWithdrawn(supabase)) {
    redirect('/auth/login?error=invalid_credentials');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
