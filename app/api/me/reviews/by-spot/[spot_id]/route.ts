import { NextResponse } from 'next/server';
import { getMyReviewForSpot } from '@/lib/queries/reviews';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ spot_id: string }>;

/**
 * GET /api/me/reviews/by-spot/[spot_id]
 *
 * スポット詳細ページから Client Island（SpotReviewInteractionIsland）が叩く。
 * `'use cache'` 化されたスポット詳細ページから「自分のレビュー」状態を切り離すための専用エンドポイント。
 *
 * 未ログインは 401 ではなく `{ isAuthenticated: false, review: null }` を 200 で返す
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
      { isAuthenticated: false, review: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const review = await getMyReviewForSpot(user.id, spotId);
  return NextResponse.json(
    { isAuthenticated: true, review },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
