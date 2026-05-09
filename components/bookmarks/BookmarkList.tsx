import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import type { BookmarkListItem } from '@/lib/queries/bookmarks';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { BookmarkRemoveButton } from './BookmarkRemoveButton';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
  'from-rose-300 via-pink-200 to-amber-100',
  'from-indigo-300 via-violet-200 to-blue-100',
];

export function BookmarkList({ items }: { items: BookmarkListItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.spotId} className="group flex flex-col">
          <div className="relative">
            <Link href={`/spots/${item.spotId}`} className="block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-card">
                {item.coverImageUrl ? (
                  <Image
                    src={item.coverImageUrl}
                    alt={COPY.common.photoAlt(item.spotName)}
                    fill
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
                {item.flowerNames.length > 0 && (
                  <span className="absolute bottom-3 left-3 rounded-pill bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
                    {item.flowerNames[0]}
                  </span>
                )}
              </div>
            </Link>
            <div className="absolute right-3 top-3">
              <BookmarkRemoveButton spotId={item.spotId} spotName={item.spotName} />
            </div>
          </div>
          <Link href={`/spots/${item.spotId}`} className="mt-3 block">
            <p className="truncate font-serif text-base font-semibold">{item.spotName}</p>
            <p className="truncate text-xs text-ink-muted">
              {item.prefectureName}
              {item.flowerNames.length > 0 && ` ・ ${item.flowerNames.slice(0, 2).join('・')}`}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {COPY.common.seasonPrefix}{' '}
              {formatSeasonRange(item.bestSeasonStart, item.bestSeasonEnd)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
