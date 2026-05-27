import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component の render 中は cookies の書き込みが禁止されているため、
            // setAll はここで握りつぶす。セッション更新の経路は呼び出し元で変わる：
            //   - /mypage/* / /admin/* / /auth/callback: middleware が同期するので即時反映
            //   - 公開ページ（middleware 対象外）: ここでの書き込みは破棄されるが、ログイン
            //     ユーザーが次に保護パスへ遷移した時点で middleware が再同期する。
            //     公開ページのレンダリングはセッション情報を必要としないので実害なし。
          }
        },
      },
    },
  );
}
