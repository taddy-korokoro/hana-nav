import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * 現在のリクエストに紐づくユーザーを取得する共通ヘルパー。
 *
 * `React.cache()` でメモ化しているため、同一リクエスト内で複数の Server
 * Component / Action / Route Handler から呼ばれても Auth サーバーへの往復は
 * 1 回にまとまる（CLAUDE.md「2. データ取得 — 重複呼び出しの抑制」）。
 *
 * 認可は呼び出し元で行う前提。admin ロール要件がある場合は
 * `lib/utils/requireAdmin.ts` を経由する。
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
