import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { containsNgWord } from '@/lib/ng-words';
import { createClient } from '@/lib/supabase/server';
import { parseReviewBody } from '@/lib/utils/reviewValidator';

type Params = Promise<{ id: string }>;

/**
 * PATCH /api/reviews/[id]
 *
 * 認証必須。自分のレビューを編集する。`rating` / `comment` / `visited_at` のみ更新可能で、
 * `spot_id` の変更は仕様上発生しない（UNIQUE(user_id, spot_id) も守れなくなる）ため受け付けない。
 *
 * UPDATE のフィルタは `auth.uid() = user_id` で RLS により守られている。再アクティブ化は
 * POST のアップサートで行うため、論理削除済みの行は対象にしない。
 */
export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = parseReviewBody(body, { requireSpotId: false });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code }, { status: 400 });
  }

  const { rating, comment, visitedAt } = parsed.value;

  if (comment && containsNgWord(comment)) {
    return NextResponse.json({ error: 'ng_word' }, { status: 400 });
  }

  // spot_id を取り出してから revalidatePath('/spots/[id]') する必要があるので
  // 更新後に取得する（SELECT は本人 + アクティブ行を見るため RLS に弾かれない）。
  const { error: updateError } = await supabase
    .from('reviews')
    .update({ rating, comment, visited_at: visitedAt })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (updateError) {
    console.error('[PATCH /api/reviews/[id]] update failed', updateError);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  const { data: row, error: fetchError } = await supabase
    .from('reviews')
    .select('spot_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[PATCH /api/reviews/[id]] failed to fetch spot_id', fetchError);
  }
  if (row?.spot_id) {
    revalidatePath(`/spots/${row.spot_id}`);
  }
  revalidatePath('/mypage/reviews');

  return NextResponse.json({ ok: true, id }, { status: 200 });
}

/**
 * DELETE /api/reviews/[id]
 *
 * 認証必須。自分のレビューを論理削除する。RLS の UPDATE は `auth.uid() = user_id` で守られているので
 * 他人のレビューは UPDATE の対象に含まれず、ヒットしなければ no-op で 200 を返す（冪等）。
 * `.select()` をチェインしないので、`deleted_at IS NULL` 限定の SELECT RLS は RETURNING に
 * 触れない。
 */
export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  // 削除前に spot_id を引いておく（revalidatePath 用）。アクティブな本人のレビューだけが対象。
  // `reviews` の SELECT RLS は `deleted_at IS NULL` を含むので暗黙にも弾かれるが、
  // RLS への依存を読まなくても意図が伝わるよう、アプリ側で明示的に `.is('deleted_at', null)` も付ける。
  const { data: existing } = await supabase
    .from('reviews')
    .select('spot_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  const { error } = await supabase
    .from('reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (error) {
    console.error('[DELETE /api/reviews/[id]] update failed', error);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  if (existing?.spot_id) {
    revalidatePath(`/spots/${existing.spot_id}`);
  }
  revalidatePath('/mypage/reviews');
  revalidatePath('/mypage');

  return NextResponse.json({ ok: true, id }, { status: 200 });
}
