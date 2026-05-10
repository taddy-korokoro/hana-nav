import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserWithdrawn } from '@/lib/utils/checkWithdrawn';

/**
 * OAuth / Magic Link / メール確認後にリダイレクトされる先。
 * code パラメータを Session に交換してセッションを確立する。
 *
 * 退会済みアカウント（profiles.deleted_at IS NOT NULL）の場合は、Session 確立後に
 * 即サインアウトしてログイン画面へエラー付きで戻す（auth.users は残しているので
 * exchangeCodeForSession 自体は成功してしまうため）。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 退会済みアカウントの存在を漏らさないため、汎用の auth_callback_failed にまとめる。
      if (await isCurrentUserWithdrawn(supabase)) {
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
