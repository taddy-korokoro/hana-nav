import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * ログアウト Route Handler。POST のみ受け付ける（CSRF 対策の最小ライン）。
 * UI 側はログアウトボタンを `<form action="/auth/logout" method="post">` で囲う。
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/auth/login`, { status: 303 });
}
