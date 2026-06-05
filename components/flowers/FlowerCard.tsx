import Image from 'next/image';
import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import type { FlowerListItem } from '@/lib/queries/flowers';
import { STATIC_BLUR_DATA_URL } from '@/lib/utils/imagePlaceholder';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

const FLOWER_GRADIENTS = [
  'from-pink-300 to-rose-200',
  'from-violet-300 to-purple-200',
  'from-sky-300 to-blue-200',
  'from-orange-300 to-amber-200',
  'from-rose-300 to-pink-100',
  'from-indigo-300 to-violet-200',
  'from-yellow-300 to-orange-200',
  'from-fuchsia-300 to-pink-200',
  'from-emerald-300 to-teal-200',
  'from-red-300 to-rose-200',
  'from-amber-300 to-yellow-200',
  'from-purple-300 to-indigo-200',
];

export function FlowerCard({ flower, index }: { flower: FlowerListItem; index: number }) {
  const seasonText = formatSeasonRange(flower.defaultSeasonStart, flower.defaultSeasonEnd);
  return (
    <Link href={`/flowers/${flower.id}`} className="group block">
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-card bg-gradient-to-br ${
          FLOWER_GRADIENTS[index % FLOWER_GRADIENTS.length]
        }`}
      >
        {flower.coverImageUrl ? (
          <Image
            src={flower.coverImageUrl}
            alt={flower.coverImageCaption ?? COPY.common.photoAlt(flower.name)}
            fill
            priority={index === 0}
            placeholder="blur"
            blurDataURL={STATIC_BLUR_DATA_URL}
            className="object-cover transition group-hover:scale-105"
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-serif text-5xl font-light text-white/85"
          >
            {flower.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="truncate font-serif text-base font-semibold">{flower.name}</p>
        {flower.nameKana && <p className="truncate text-xs text-ink-faint">{flower.nameKana}</p>}
        {seasonText && (
          <p className="mt-0.5 text-xs text-ink-muted">
            {COPY.common.seasonPrefix} {seasonText}
          </p>
        )}
      </div>
    </Link>
  );
}
