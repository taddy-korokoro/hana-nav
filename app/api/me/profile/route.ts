import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/utils/usernameValidator';

/**
 * GET /api/me/profile
 *
 * 認証状態とプロフィール情報を返す。SiteHeader の Client 側から
 * ログイン状態を判定するために使う。未認証は 200 + null。
 * Cache-Control: private, no-store でユーザー個別に分離。
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(null, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  return NextResponse.json(
    {
      email: user.email ?? '',
      username: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isAdmin: profile?.role === 'admin',
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

/**
 * PATCH /api/me/profile
 *
 * 認証必須。`{ username?: string; avatar_url?: string | null }` の部分更新。
 * - 通常のプロフィール編集は Server Action（`app/(site)/mypage/profile/actions.ts`）を使う。
 *   この Route Handler は外部連携 / 将来のクライアントから直接叩きたい場合の任意エンドポイント。
 * - UNIQUE 制約違反は 409 にマッピング。
 * - `avatar_url` の物理ファイル削除は MVP では行わない（specs/tech-stack.md 参照）。
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const patch: { username?: string; avatar_url?: string | null } = {};

  if ('username' in body) {
    const validated = validateUsername((body as { username: unknown }).username);
    if (!validated.ok) {
      return NextResponse.json({ error: 'invalid_username' }, { status: 400 });
    }
    patch.username = validated.value;
  }

  if ('avatar_url' in body) {
    const value = (body as { avatar_url: unknown }).avatar_url;
    if (value === null) {
      patch.avatar_url = null;
    } else if (typeof value === 'string' && value.length > 0 && value.length <= 2048) {
      patch.avatar_url = value;
    } else {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'username_taken' }, { status: 409 });
    }
    console.error('[PATCH /api/me/profile] update failed', error);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  revalidatePath('/mypage', 'layout');

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
