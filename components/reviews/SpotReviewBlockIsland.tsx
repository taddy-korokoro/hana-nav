'use client';

import { useEffect, useState } from 'react';
import { SpotReviewSection } from '@/components/spots/SpotReviewSection';
import type { SpotReview } from '@/lib/queries/spotDetail';
import type { ReviewFormInitial } from './ReviewForm';
import { SpotReviewInteraction } from './SpotReviewInteraction';

type Props = {
  spotId: string;
  /** マイページ等から `?edit=review` で遷移してきた場合に true。投稿済みなら初期表示で編集フォームを展開する。 */
  editIntent: boolean;
  /** スポット詳細キャッシュから渡される全件レビュー（サーバー側で取得・公開可）。 */
  reviews: SpotReview[];
  /** スポット詳細キャッシュから渡される平均スコア・件数。 */
  summary: { count: number; average: number | null };
};

type ApiReview = {
  id: string;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
};

type InteractionState =
  | {
      isAuthenticated: boolean;
      myReview: ReviewFormInitial | null;
    }
  | undefined;

/**
 * スポット詳細のレビューブロック（投稿/編集導線 + 一覧）をユーザー依存状態の取得込みでラップする
 * Client Island。
 *
 * 親（spots/[id]/page.tsx の Server Component）は `'use cache'` で公開キャッシュに乗せたいので、
 * `auth.getUser()` / `getMyReviewForSpot` のような Cookie 依存処理をサーバー側で行えない。
 * この Island が `/api/me/reviews/by-spot/[spot_id]` を fetch して、ログイン状態 +
 * 自分のレビューをクライアントサイドで解決する（UserNavIsland と同じ設計）。
 *
 * 一覧（SpotReviewSection）の「あなたのレビュー」バッジ表示も、自分のレビュー ID が確定してから
 * `myReviewId` を渡す形で連動する。fetch 完了前は myReviewId=null で表示し、解決後に
 * ハイライトが追加される（視覚的に若干 flicker するが、ログインユーザーのみの体感で許容範囲）。
 *
 * `?edit=review` の自動展開は、`editIntent && !!myReview` の両方を満たした場合のみ展開する
 * （投稿していなければ「編集フォーム」を開く意味がないため）。
 */
export function SpotReviewBlockIsland({ spotId, editIntent, reviews, summary }: Props) {
  const [state, setState] = useState<InteractionState>(undefined);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/me/reviews/by-spot/${spotId}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { isAuthenticated: boolean; review: ApiReview | null } | null) => {
        if (!mounted || !data) return;
        const myReview: ReviewFormInitial | null = data.review
          ? {
              reviewId: data.review.id,
              rating: data.review.rating,
              comment: data.review.comment ?? '',
              visitedAt: data.review.visitedAt ?? '',
            }
          : null;
        setState({ isAuthenticated: data.isAuthenticated, myReview });
      })
      .catch(() => {
        if (mounted) setState({ isAuthenticated: false, myReview: null });
      });
    return () => {
      mounted = false;
    };
  }, [spotId]);

  const loaded = state !== undefined;
  const isAuthenticated = state?.isAuthenticated ?? false;
  const myReview = state?.myReview ?? null;

  return (
    <>
      {loaded ? (
        <SpotReviewInteraction
          spotId={spotId}
          isAuthenticated={isAuthenticated}
          myReview={myReview}
          defaultOpen={editIntent && !!myReview}
        />
      ) : (
        // SpotReviewInteraction の各表示パターン（ログイン誘導カード / レビュー誘導カード / 編集導線）
        // と同じ高さの枠を予約しておく。レイアウトシフトを防ぐ。
        <div className="h-20 animate-pulse rounded-card border border-line bg-white" aria-hidden />
      )}

      <SpotReviewSection
        reviews={reviews}
        summary={summary}
        myReviewId={myReview?.reviewId ?? null}
      />
    </>
  );
}
