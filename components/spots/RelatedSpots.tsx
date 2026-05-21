import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { RelatedSpot } from '@/lib/queries/spotDetail';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
];

export function RelatedSpots({ spots }: { spots: RelatedSpot[] }) {
  if (spots.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
            {COPY.spotDetail.sections.relatedEyebrow}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">
            {COPY.spotDetail.sections.relatedTitle}
          </h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {spots.map((spot, i) => (
          <Link key={spot.id} href={`/spots/${spot.id}`} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              {spot.coverImageUrl ? (
                <Image
                  src={spot.coverImageUrl}
                  alt={spot.coverImageCaption ?? COPY.common.photoAlt(spot.name)}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                />
              ) : (
                <div
                  className={`size-full bg-gradient-to-br ${
                    PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]
                  }`}
                  aria-hidden
                />
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-serif text-base font-semibold">{spot.name}</p>
                <p className="truncate text-xs text-ink-muted">{spot.prefectureName}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {COPY.common.seasonPrefix}{' '}
                  {formatSeasonRange(spot.bestSeasonStart, spot.bestSeasonEnd)}
                </p>
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
