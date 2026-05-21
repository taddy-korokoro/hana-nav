import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { SpotSearchResult } from '@/lib/queries/spotSearch';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
  'from-rose-300 via-pink-200 to-amber-100',
  'from-indigo-300 via-violet-200 to-blue-100',
];

export function SpotCard({ spot, index }: { spot: SpotSearchResult; index: number }) {
  return (
    <Link href={`/spots/${spot.id}`} className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card">
        {spot.coverImageUrl ? (
          <Image
            src={spot.coverImageUrl}
            alt={spot.coverImageCaption ?? COPY.common.photoAlt(spot.name)}
            fill
            priority={index === 0}
            className="object-cover transition group-hover:scale-105"
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div
            className={`size-full bg-gradient-to-br ${
              PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
            }`}
            aria-hidden
          />
        )}
        {spot.flowerNames.length > 0 && (
          <span className="absolute bottom-3 left-3 rounded-pill bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
            {spot.flowerNames[0]}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-base font-semibold">{spot.name}</p>
          <p className="truncate text-xs text-ink-muted">
            {spot.prefectureName}
            {spot.flowerNames.length > 0 && ` ・ ${spot.flowerNames.slice(0, 2).join('・')}`}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {COPY.common.seasonPrefix} {formatSeasonRange(spot.bestSeasonStart, spot.bestSeasonEnd)}
          </p>
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
      </div>
    </Link>
  );
}
