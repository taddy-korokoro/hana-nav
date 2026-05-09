import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { Pagination } from '@/components/spots/Pagination';
import { SpotCard } from '@/components/spots/SpotCard';
import { SpotFilterPanel } from '@/components/spots/SpotFilterPanel';
import { SpotMapView } from '@/components/spots/SpotMapView';
import { COPY } from '@/lib/constants/copy';
import {
  getFlowerOptions,
  getPrefectureGroups,
  parseSpotSearchParams,
  searchSpots,
  serializeSpotSearchParams,
} from '@/lib/queries/spotSearch';

export const dynamic = 'force-dynamic';

// SEO: クエリパラメータ重複の問題を避けるため検索結果ページは noindex
export const metadata: Metadata = {
  title: COPY.spotsList.metaTitle,
  description: COPY.spotsList.metaDescription,
  robots: { index: false, follow: true },
};

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = parseSpotSearchParams(raw);

  const [result, prefectureGroups, flowers] = await Promise.all([
    searchSpots(params),
    getPrefectureGroups(),
    getFlowerOptions(),
  ]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isMapView = params.view === 'map';
  const hasFilter = Boolean(
    params.prefecture || params.flower || params.region || params.month || params.q,
  );

  const buildPageHref = (page: number) => {
    const qs = serializeSpotSearchParams({ ...params, page });
    return qs ? `/spots?${qs}` : '/spots';
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.spotsList.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {COPY.spotsList.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
          {COPY.spotsList.description}
        </p>
      </section>

      <SpotFilterPanel current={params} prefectureGroups={prefectureGroups} flowers={flowers} />

      <section className="flex items-baseline justify-between border-t border-line pt-6">
        <p className="text-sm text-ink-muted">
          <span className="font-serif text-2xl font-bold text-ink">{result.totalCount}</span>
          <span className="ml-2">
            {COPY.spotsList.countSuffix}
            {result.totalCount > 0 && COPY.spotsList.pageProgress(result.page, result.totalPages)}
          </span>
        </p>
        {hasFilter && (
          <Link href="/spots" className="text-xs font-medium text-ink-muted hover:text-ink">
            {COPY.spotsList.clearFilter}
          </Link>
        )}
      </section>

      {result.items.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold">{COPY.spotsList.empty.title}</p>
          <p className="mt-2 text-sm text-ink-muted">{COPY.spotsList.empty.description}</p>
          <Link
            href="/spots"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            {COPY.spotsList.clearFilter}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      ) : isMapView ? (
        <div className="mt-6 space-y-4">
          {apiKey ? (
            <SpotMapView
              spots={result.items.filter((s) => s.latitude != null && s.longitude != null)}
              apiKey={apiKey}
            />
          ) : (
            <div className="rounded-card border border-line bg-white p-6 text-center text-sm text-ink-muted">
              {COPY.spotsList.mapApiMissing}
            </div>
          )}
          <p className="text-xs text-ink-faint">{COPY.spotsList.mapPinNotice}</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((spot, i) => (
              <SpotCard key={spot.id} spot={spot} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((spot, i) => (
            <SpotCard key={spot.id} spot={spot} index={i} />
          ))}
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildPageHref} />
    </div>
  );
}
