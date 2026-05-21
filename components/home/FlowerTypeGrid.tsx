import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { FeaturedFlower } from '@/lib/queries/topSpots';
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

export function FlowerTypeGrid({ flowers }: { flowers: FeaturedFlower[] }) {
  if (flowers.length === 0) return null;

  return (
    <section className="pt-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
            {COPY.home.flowerTypes.eyebrow}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">
            {COPY.home.flowerTypes.title}
          </h2>
        </div>
        <Link
          href="/flowers"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink hover:text-brand"
        >
          {COPY.common.seeAll}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {flowers.map((flower, i) => (
          <Link key={flower.id} href={`/flowers/${flower.id}`} className="group block">
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-card bg-gradient-to-br ${
                FLOWER_GRADIENTS[i % FLOWER_GRADIENTS.length]
              }`}
            >
              {flower.coverImageUrl ? (
                <Image
                  src={flower.coverImageUrl}
                  alt={flower.coverImageCaption ?? COPY.common.photoAlt(flower.name)}
                  fill
                  priority={i === 0}
                  className="object-cover transition group-hover:scale-105"
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center font-serif text-5xl font-light text-white/80">
                  {flower.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="mt-2">
              <p className="truncate font-serif text-base font-semibold">{flower.name}</p>
              <p className="text-xs text-ink-faint">
                {formatSeasonRange(flower.defaultSeasonStart, flower.defaultSeasonEnd) || ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
