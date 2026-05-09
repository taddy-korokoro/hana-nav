import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ spot_id: string }>;

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
