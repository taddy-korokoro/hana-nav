/**
 * 採用者確認用ゲスト管理者の識別ヘルパー。
 * DB に `is_guest` カラムを足さず、認証情報を **コード内定数**として持つ方針。
 * ゲストとして識別されたユーザーは admin ロール持ちでも **書き込み系の Server Action /
 * Route Handler を実行できない**（`requireWriteAdmin()` で拒否）。
 *
 * セットアップ手順（本番）:
 *  1. Supabase Auth で `GUEST_ADMIN.email` のユーザーを 1 件作成し、下のパスワードでログイン可能にする
 *  2. `profiles.role = 'admin'` を UPDATE
 *
 * 「定数として平文で git に残す」ことを意識的に選んでいる:
 *  - このアカウントは**閲覧専用**で、書き込み API は層 1（`requireWriteAdmin`）で拒否される
 *  - 認証情報を公開しても「閲覧 DDoS」程度しか起きず、それは Vercel / Supabase 側のレート制限で受ける
 *  - .env / Vercel Project Settings での管理を省くため
 */

import type { User } from '@supabase/supabase-js';

export const GUEST_ADMIN = {
  email: 'guest@hananav.site',
  password: 'hana-nav-demo-readonly-2026',
} as const;

export function isGuestAdmin(user: Pick<User, 'id' | 'email'> | null | undefined): boolean {
  if (!user?.email) return false;
  return user.email.toLowerCase() === GUEST_ADMIN.email.toLowerCase();
}

/**
 * ゲストログインボタンを UI に出すか判定。コード内定数で常に有効なので true 固定。
 * （将来「ボタンを一時的に隠したい」要件が出たら定数フラグや feature flag に置き換える）
 */
export function isGuestLoginAvailable(): boolean {
  return true;
}
