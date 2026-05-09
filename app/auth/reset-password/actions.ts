'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requestReset(formData: FormData) {
  const email = formData.get('email');

  if (typeof email !== 'string' || !email) {
    redirect('/auth/reset-password?error=invalid_input');
  }

  const supabase = await createClient();
  // NEXT_PUBLIC_BASE_URL が未設定の場合、x-forwarded-proto から実際のスキームを
  // 拾うことで dev（HTTP）/ 本番（HTTPS）を自動で切り分ける。
  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host') ?? 'localhost:3000';
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;

  // resetPasswordForEmail のメール内リンクは /auth/callback に戻り、
  // /auth/update-password にリダイレクトされる構成にしておく。
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });

  // メール存在/不存在の差を出さないよう、エラーがあっても成功画面に遷移する。
  if (error) {
    // ログだけ残す（個別の失敗理由はユーザーに見せない）
    console.error('resetPasswordForEmail error:', error.message);
  }

  redirect('/auth/reset-password?status=email_sent');
}
