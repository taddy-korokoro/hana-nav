import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { containsNgWord } from '@/lib/ng-words';
import { createClient } from '@/lib/supabase/server';
import { parseReviewBody } from '@/lib/utils/reviewValidator';

/**
 * POST /api/reviews
 *
 * 認証必須。`{ spot_id, rating, comment?, visited_at? }` を受領し、
 * 論理削除運用で UPSERT 風に処理する：
 *
 * - 既存レコードがない → INSERT
 * - 同じ (user_id, spot_id) で論理削除済み → `deleted_at = NULL` で再アクティブ化 + 内容差し替え
 * - 既にアクティブな本人レビューがある → 内容を上書き（同じ画面の「編集」動線）
 *
 * バリデーション:
 *   - rating: 1〜5 の整数
 *   - comment: 200 文字以下（null / 空文字許容）
 *   - visited_at: YYYY-MM-DD 形式の文字列（null / 空文字許容）
 *   - NG ワード検出時は 400 で `ng_word`
 *
 * `reviews` の SELECT RLS は `deleted_at IS NULL` 限定。本ハンドラは `.select()` を
 * チェインしないので RETURNING の RLS 違反は発生しない。
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

  const parsed = parseReviewBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code }, { status: 400 });
  }

  const { spotId, rating, comment, visitedAt } = parsed.value;

  if (comment && containsNgWord(comment)) {
    return NextResponse.json({ error: 'ng_word' }, { status: 400 });
  }

  const { error: upsertError } = await supabase.from('reviews').upsert(
    {
      user_id: user.id,
      spot_id: spotId,
      rating,
      comment,
      visited_at: visitedAt,
      deleted_at: null,
    },
    { onConflict: 'user_id,spot_id' },
  );

  if (upsertError) {
    console.error('[POST /api/reviews] upsert failed', upsertError);
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 });
  }

  revalidatePath(`/spots/${spotId}`);
  revalidatePath('/mypage/reviews');
  revalidatePath('/mypage');

  return NextResponse.json({ ok: true, spot_id: spotId }, { status: 200 });
}
