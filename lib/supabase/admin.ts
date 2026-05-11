import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service Role キーを使う管理用クライアント。RLS をバイパスするので
 * **必ず Route Handler / Server Action / バッチスクリプト内に閉じ込めて使う**。
 * Server Component から呼ぶ場合も「RLS をバイパスしている自覚」を持って使うこと。
 *
 * CLAUDE.md「Supabase クライアントはリクエストごとに新規生成する（モジュール
 * スコープでキャッシュしない）」に従い、関数として返す。
 */
export function createAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
