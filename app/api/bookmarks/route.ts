import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/bookmarks
 *
 * 認証必須。`{ spot_id }` を受領し、論理削除運用で UPSERT 風に処理する：
 * - 既存レコードがない → INSERT
 * - 論理削除済みレコードがある → `deleted_at = NULL` で再アクティブ化
 * - 既にアクティブ → no-op（冪等）
 *
 * `bookmarks` の SELECT RLS は `deleted_at IS NULL` 限定なので、論理削除済みを
 * 個別に SELECT して判定することはできない。そのため `upsert(onConflict)` で
 * DB 側に INSERT/UPDATE を委ねる。`created_at` はカラムを INSERT 列に含めない
 * ので EXCLUDED で上書きされず、再アクティブ化時も初回作成時刻を保持する。
 */
export async function POST(request: Request) {
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

  const spotId =
    body && typeof body === 'object' && 'spot_id' in body
      ? (body as { spot_id: unknown }).spot_id
      : null;
  if (typeof spotId !== 'string' || spotId.length === 0) {
    return NextResponse.json({ error: 'invalid_spot_id' }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from('bookmarks')
    .upsert(
      { user_id: user.id, spot_id: spotId, deleted_at: null },
      { onConflict: 'user_id,spot_id' },
    );

  if (upsertError) {
    console.error('[POST /api/bookmarks] upsert failed', upsertError);
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 });
  }

  revalidatePath('/mypage/bookmarks');

  return NextResponse.json({ ok: true, spot_id: spotId }, { status: 200 });
}
