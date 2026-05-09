'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * ログアウト Server Action。
 * UI 側は `<form action={logout}>` でフォームをラップする。
 * CLAUDE.md「Supabase Auth 実装ルール §9」準拠。
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}
