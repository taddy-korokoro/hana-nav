import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /*
   * 保護パス + OAuth コールバックに限定する（チケット 22 §0-1）。
   *
   * 全パスに matcher を効かせると、公開ページのリクエストでも毎回
   * `supabase.auth.getUser()` が走って Vercel の Fluid Active CPU を消費し、
   * bot トラフィック流入時に無料枠を即超過する。
   *
   * 公開ページはセッション情報を必要としないので、middleware の
   * 認可リダイレクトロジックが必要なパスのみに絞る：
   *  - /mypage/*: ログイン必須
   *  - /admin/*: 管理者ロール必須（updateSession 内で role チェック）
   *  - /auth/callback: OAuth/Magic Link 直後のセッション cookie 同期
   *
   * ログインユーザーが公開ページから保護パスに遷移しても、
   * lib/supabase/server.ts の createClient → cookies.setAll で
   * その時点でセッションは同期されるので実害なし。
   */
  matcher: ['/mypage/:path*', '/admin/:path*', '/auth/callback'],
};
