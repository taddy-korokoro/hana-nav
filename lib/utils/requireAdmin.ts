import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { isGuestAdmin } from '@/lib/auth/guestAdmin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/get-user';
import type { User } from '@supabase/supabase-js';

/**
 * Server Component / Server Action / Route Handler から呼び、admin ロール
 * でなければ `/` にリダイレクトする。未ログインの場合は middleware が先に
 * /auth/login へ捌くが、middleware 経路外（直接呼び出し）でも安全側に倒す。
 *
 * `getCurrentUser()` を経由するため、同一リクエスト内で `requireAdmin()` と
 * 別の `getCurrentUser()` 呼び出しがあっても Auth サーバー往復は 1 回に
 * まとまる（`React.cache` メモ化）。
 *
 * 戻り値は admin ユーザー本体。`profiles.role` を再取得したい場合は呼び出し
 * 元で別途 select する。
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createClient();
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

/**
 * ゲストモード（採用者確認用ログイン）で書き込み操作を試みたときに throw する。
 * Server Action から投げると、呼び出し元の error boundary（`app/admin/error.tsx`）
 * が「閲覧専用です」を表示する。Route Handler では `requireWriteAdminOrResponse()`
 * を使う方が JSON 403 として返せて UX 的に綺麗。
 */
export class GuestModeError extends Error {
  constructor() {
    super('ゲストモード（閲覧専用）では書き込みできません');
    this.name = 'GuestModeError';
  }
}

/**
 * 書き込み系の Server Action 冒頭で `await requireAdmin()` の代わりに呼ぶ。
 * admin ロール持ちであっても、env で識別される **ゲスト管理者**であれば throw する。
 */
export async function requireWriteAdmin(): Promise<User> {
  const user = await requireAdmin();
  if (isGuestAdmin(user)) {
    throw new GuestModeError();
  }
  return user;
}

/**
 * 書き込み系の Route Handler（POST / PATCH / DELETE）冒頭で
 * `const block = await requireWriteAdminOrResponse(); if (block) return block;` の形で使う。
 * 通常 admin であれば null を返し処理続行、ゲストなら 403 JSON を返す。
 */
export async function requireWriteAdminOrResponse(): Promise<NextResponse | null> {
  const user = await requireAdmin();
  if (isGuestAdmin(user)) {
    return NextResponse.json(
      { error: 'guest_read_only', message: 'ゲストモードでは書き込みできません' },
      { status: 403 },
    );
  }
  return null;
}
