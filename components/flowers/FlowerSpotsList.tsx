import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { FlowerSpot } from '@/lib/queries/flowers';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
];

/**
 * 花詳細ページ「この花が見られるスポット」一覧。
 * `bloomStartMonth` が登録されている場合はスポット固有の見頃を優先し、無ければ
 * `bestSeason*` を表示する（spot_flowers の見頃は flowers.default_season_* よりも
 * スポット個別の精度が高い、という DB 設計の優先度に従う）。
 */
export function FlowerSpotsList({ spots }: { spots: FlowerSpot[] }) {
  if (spots.length === 0) {
    return (
      <p className="rounded-card border border-line bg-white p-6 text-sm text-ink-muted">
        {COPY.flowerDetail.spots.empty}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot, i) => {
        const seasonRange =
          spot.bloomStartMonth != null && spot.bloomEndMonth != null
            ? formatSeasonRange(spot.bloomStartMonth, spot.bloomEndMonth)
            : formatSeasonRange(spot.bestSeasonStart, spot.bestSeasonEnd);
        return (
          <Link key={spot.id} href={`/spots/${spot.id}`} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              {spot.coverImageUrl ? (
                <Image
                  src={spot.coverImageUrl}
                  alt={spot.coverImageCaption ?? COPY.common.photoAlt(spot.name)}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                />
              ) : (
                <div
                  aria-hidden
                  className={`size-full bg-gradient-to-br ${
                    PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]
                  }`}
                />
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-serif text-base font-semibold">{spot.name}</p>
                <p className="truncate text-xs text-ink-muted">{spot.prefectureName}</p>
                {seasonRange && (
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {COPY.common.seasonPrefix} {seasonRange}
                  </p>
                )}
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
