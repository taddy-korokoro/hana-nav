import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { SeasonalSpot } from '@/lib/queries/topSpots';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
  'from-rose-300 via-pink-200 to-amber-100',
  'from-indigo-300 via-violet-200 to-blue-100',
];

export function FeaturedSpots({
  spots,
  currentMonth,
}: {
  spots: SeasonalSpot[];
  currentMonth: number;
}) {
  if (spots.length === 0) {
    return (
      <section className="pt-16">
        <SectionHeader
          eyebrow={COPY.home.featured.eyebrow}
          title={COPY.home.featured.title}
          linkLabel={COPY.home.featured.empty.seeAll}
          linkHref={`/spots?month=${currentMonth}`}
        />
        <div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold">{COPY.home.featured.empty.title}</p>
          <p className="mt-2 text-sm text-ink-muted">{COPY.home.featured.empty.description}</p>
          <Link
            href="/flowers"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            {COPY.home.featured.empty.cta}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-16">
      <SectionHeader
        eyebrow={COPY.home.featured.eyebrow}
        title={COPY.home.featured.title}
        linkLabel={COPY.common.seeAll}
        linkHref={`/spots?month=${currentMonth}`}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {spots.slice(0, 12).map((spot, i) => (
          <Link key={spot.id} href={`/spots/${spot.id}`} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              {spot.coverImageUrl ? (
                <Image
                  src={spot.coverImageUrl}
                  alt={spot.coverImageCaption ?? COPY.common.photoAlt(spot.name)}
                  fill
                  priority={i === 0}
                  className="object-cover transition group-hover:scale-105"
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
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
                <p className="truncate text-xs text-ink-muted">
                  {spot.prefectureName}
                  {spot.flowerNames.length > 0 && ` ・ ${spot.flowerNames.slice(0, 2).join('・')}`}
                </p>
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

function SectionHeader({
  eyebrow,
  title,
  linkLabel,
  linkHref,
}: {
  eyebrow?: string;
  title: string;
  linkLabel?: string;
  linkHref?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink hover:text-brand"
        >
          {linkLabel}
          <ArrowRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
