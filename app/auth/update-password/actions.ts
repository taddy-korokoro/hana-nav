'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function updatePassword(formData: FormData) {
  const password = formData.get('password');
  const passwordConfirm = formData.get('password_confirm');

  if (typeof password !== 'string' || typeof passwordConfirm !== 'string') {
    redirect('/auth/update-password?error=invalid_input');
  }

  if (password !== passwordConfirm) {
    redirect('/auth/update-password?error=password_mismatch');
  }

  if (password.length < 8) {
    redirect('/auth/update-password?error=password_too_short');
  }

  const supabase = await createClient();

  // /auth/callback でセッションが確立済み（resetPasswordForEmail 経由）の前提。
  // ここで getUser() を呼んで未ログインなら /auth/login に戻す。
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?error=auth_callback_failed');
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect('/auth/update-password?error=update_failed');
  }

  revalidatePath('/', 'layout');
  redirect('/mypage?status=password_updated');
}
