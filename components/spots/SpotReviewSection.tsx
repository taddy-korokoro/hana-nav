import { StarRating } from '@/components/reviews/StarRating';
import { COPY } from '@/lib/constants/copy';
import type { SpotReview } from '@/lib/queries/spotDetail';

type Props = {
  reviews: SpotReview[];
  summary: { count: number; average: number | null };
  /** ログインユーザー自身のレビュー ID（カード上に「あなたのレビュー」バッジを付ける用）。 */
  myReviewId?: string | null;
};

/**
 * レビュー一覧 + 平均評価。`reviewer === null` は profiles の RLS（deleted_at IS NULL のみ参照）で
 * 退会済ユーザーが filter された結果なので、operations.md の方針通り「退会済ユーザー」と表示する。
 *
 * `myReviewId` が一致するカードには「あなたのレビュー」バッジを付け、編集導線（上部の
 * SpotReviewInteraction）と視覚的に紐づけている。
 */
export function SpotReviewSection({ reviews, summary, myReviewId = null }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <StarRating rating={summary.average ?? 0} />
        <p className="text-sm text-ink-muted">
          {summary.average != null ? (
            <>
              <span className="font-serif text-lg font-semibold text-ink">
                {summary.average.toFixed(1)}
              </span>
              <span className="ml-1.5">{COPY.spotDetail.reviews.ratingDenominator}</span>
              <span className="ml-3">{COPY.spotDetail.reviews.countSuffix(summary.count)}</span>
            </>
          ) : (
            <span>{COPY.spotDetail.reviews.empty}</span>
          )}
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-white p-6 text-center text-sm text-ink-muted">
          {COPY.spotDetail.reviews.promptFirst}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => {
            const isMine = myReviewId != null && review.id === myReviewId;
            return (
              <li
                key={review.id}
                className={`min-w-0 overflow-hidden rounded-card border bg-white p-4 md:p-5 ${
                  isMine ? 'border-brand/50 ring-1 ring-brand/20' : 'border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {review.reviewer?.username ?? COPY.spotDetail.reviews.withdrawnUser}
                      {isMine && (
                        <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                          {COPY.spotDetail.reviews.yourReviewBadge}
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                      <StarRating rating={review.rating} size="sm" />
                      <span>
                        {review.visitedAt
                          ? COPY.spotDetail.reviews.visitedAt(formatDate(review.visitedAt))
                          : COPY.spotDetail.reviews.postedAt(formatDate(review.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-ink">
                    {review.comment}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
