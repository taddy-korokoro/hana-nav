'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signup(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const passwordConfirm = formData.get('password_confirm');

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof passwordConfirm !== 'string'
  ) {
    redirect('/auth/signup?error=invalid_input');
  }

  if (password !== passwordConfirm) {
    redirect('/auth/signup?error=password_mismatch');
  }

  if (password.length < 8) {
    redirect('/auth/signup?error=password_too_short');
  }

  const supabase = await createClient();

  // Email Auth は確認メール内のリンクで /auth/callback に戻ってくる必要がある。
  // emailRedirectTo を環境別に組み立てる（開発: localhost HTTP、本番: BASE_URL）。
  // NEXT_PUBLIC_BASE_URL が未設定の場合、x-forwarded-proto から実際のスキームを
  // 拾うことで「dev は HTTP / Vercel など本番は HTTPS」を自動で切り分ける。
  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host') ?? 'localhost:3000';
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect('/auth/signup?error=signup_failed');
  }

  redirect('/auth/signup?status=email_sent');
}
