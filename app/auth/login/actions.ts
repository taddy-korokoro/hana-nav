'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserWithdrawn } from '@/lib/utils/checkWithdrawn';

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
