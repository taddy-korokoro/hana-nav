import { StarIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { SpotReview } from '@/lib/queries/spotDetail';

type Props = {
  reviews: SpotReview[];
  summary: { count: number; average: number | null };
};

/**
 * レビュー一覧 + 平均評価。`reviewer === null` は profiles の RLS（deleted_at IS NULL のみ参照）で
 * 退会済ユーザーが filter された結果なので、operations.md の方針通り「退会済ユーザー」と表示する。
 */
export function SpotReviewSection({ reviews, summary }: Props) {
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
          {reviews.map((review) => (
            <li key={review.id} className="rounded-card border border-line bg-white p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {review.reviewer?.username ?? COPY.spotDetail.reviews.withdrawnUser}
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
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const filled = Math.round(rating);
  const sizeClass = size === 'sm' ? 'size-3.5' : 'size-5';
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={COPY.spotDetail.reviews.ratingAria(rating)}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`${sizeClass} ${i < filled ? 'text-brand' : 'text-line-strong'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
