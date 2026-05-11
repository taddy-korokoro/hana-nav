import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import type { MyReviewListItem } from '@/lib/queries/reviews';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { MyReviewDeleteButton } from './MyReviewDeleteButton';
import { StarRating } from './StarRating';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
  'from-rose-300 via-pink-200 to-amber-100',
  'from-indigo-300 via-violet-200 to-blue-100',
];

/**
 * マイページの「自分のレビュー」一覧。編集は /spots/[id] へ遷移して
 * SpotReviewInteraction の編集モードから行う（フォームの実体が同じため重複を作らない）。
 */
export function MyReviewList({ items }: { items: MyReviewListItem[] }) {
  return (
    <ul className="space-y-6">
      {items.map((item, index) => (
        <li
          key={item.reviewId}
          className="flex flex-col gap-4 rounded-card border border-line bg-white p-4 sm:flex-row sm:gap-5 sm:p-5"
        >
          <Link
            href={`/spots/${item.spot.id}`}
            aria-label={COPY.mypage.reviews.visitSpotAria(item.spot.name)}
            className="block shrink-0 overflow-hidden rounded-card sm:w-48"
          >
            <div className="relative aspect-[4/3] w-full">
              {item.spot.coverImageUrl ? (
                <Image
                  src={item.spot.coverImageUrl}
                  alt={COPY.common.photoAlt(item.spot.name)}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 192px, 100vw"
                />
              ) : (
                <div
                  className={`size-full bg-gradient-to-br ${
                    PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
                  }`}
                  aria-hidden
                />
              )}
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/spots/${item.spot.id}`}
                  className="block truncate font-serif text-lg font-semibold hover:text-brand"
                >
                  {item.spot.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {item.spot.prefectureName}
                  {' ・ '}
                  {COPY.common.seasonPrefix}{' '}
                  {formatSeasonRange(item.spot.bestSeasonStart, item.spot.bestSeasonEnd)}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
              <StarRating rating={item.rating} size="sm" />
              <span>
                {item.visitedAt
                  ? COPY.spotDetail.reviews.visitedAt(formatDate(item.visitedAt))
                  : COPY.spotDetail.reviews.postedAt(formatDate(item.createdAt))}
              </span>
            </div>

            {item.comment && (
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-ink">
                {item.comment}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/spots/${item.spot.id}?edit=review#reviews`}
                aria-label={COPY.mypage.reviews.editAria(item.spot.name)}
                className="inline-flex items-center justify-center rounded-pill border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink transition hover:border-line-strong"
              >
                {COPY.mypage.reviews.edit}
              </Link>
              <MyReviewDeleteButton reviewId={item.reviewId} spotName={item.spot.name} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}
