import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyBookmarks } from '@/lib/queries/bookmarks';

/**
 * GET /api/me/bookmarks
 *
 * 認証必須。自分のブックマーク一覧（spots を join）。マイページ（Server Component）からは
 * 直接 `getMyBookmarks` を呼ぶため通常は使わない。外部連携 / 将来のクライアント側プリフェッチ用。
 *
 * ユーザー固有データのため CDN キャッシュは付けない。
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const bookmarks = await getMyBookmarks(user.id);
  return NextResponse.json({ bookmarks }, { headers: { 'Cache-Control': 'private, no-store' } });
}
