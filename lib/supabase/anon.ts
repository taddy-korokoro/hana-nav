import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Anon キーを使う、cookies() に依存しないサーバー Supabase クライアント。
 *
 * Server Component から `lib/supabase/server.ts` の `createClient()` を呼ぶと
 * 内部で `cookies()` を参照するため、Next.js がルートを dynamic レンダリングに
 * 強制オプトインし、`revalidate` が no-op になって ISR が効かなくなる。
 *
 * 公開データ（`is_published=true` / `deleted_at IS NULL` 等で RLS が許可する
 * 範囲）を取得するクエリでは `createAnonClient()` を使うことで、cookies 依存
 * を切ってルートを CDN キャッシュ可能（静的化 or ISR）にする。
 *
 * 注意：認証ユーザー固有の情報（ブックマーク・レビュー一覧・管理者判定など）
 * を取得する用途には使わない。auth セッションが必要な処理は従来通り
 * `lib/supabase/server.ts` の `createClient()` を使う。
 */
export function createAnonClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
