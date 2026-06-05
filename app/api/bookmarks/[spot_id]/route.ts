import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isBookmarked } from '@/lib/queries/bookmarks';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ spot_id: string }>;

/**
 * GET /api/bookmarks/[spot_id]
 *
 * スポット詳細ページから Client Island（BookmarkButtonIsland）が叩く。
 * `'use cache'` 化されたスポット詳細ページからユーザー依存の状態を切り離すための専用エンドポイント。
 *
 * 未ログインは 401 ではなく `{ isAuthenticated: false, bookmarked: false }` を 200 で返す
 * （Island 側で「ログイン誘導 UI」を出すため、エラー扱いにしない）。
 */
export async function GET(_request: Request, { params }: { params: Params }) {
  const { spot_id: spotId } = await params;

  if (!spotId) {
    return NextResponse.json({ error: 'invalid_spot_id' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { isAuthenticated: false, bookmarked: false },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const bookmarked = await isBookmarked(user.id, spotId);
  return NextResponse.json(
    { isAuthenticated: true, bookmarked },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

/**
 * DELETE /api/bookmarks/[spot_id]
 *
 * 論理削除（`deleted_at = NOW()`）。RLS の SELECT は `deleted_at IS NULL` 限定なので、
 * ヒットしなくても 404 とせず 200 を返す（冪等。既に解除済 / もともと未保存どちらでも OK）。
 * UPDATE のフィルタは `auth.uid() = user_id` で守られている。
 */
export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { spot_id: spotId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!spotId) {
    return NextResponse.json({ error: 'invalid_spot_id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('bookmarks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('spot_id', spotId)
    .is('deleted_at', null);

  if (error) {
    console.error('[DELETE /api/bookmarks/[spot_id]] update failed', error);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  revalidatePath('/mypage/bookmarks');

  return NextResponse.json({ ok: true, spot_id: spotId }, { status: 200 });
}
