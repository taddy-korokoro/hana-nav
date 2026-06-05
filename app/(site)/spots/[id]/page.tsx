import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  AffiliateHotelSection,
  AffiliateHotelSectionSkeleton,
} from '@/components/affiliate/AffiliateHotelSection';
import { BookmarkButtonIsland } from '@/components/bookmarks/BookmarkButtonIsland';
import { ExternalLinkIcon, InfoIcon, MapPinIcon } from '@/components/layout/icons';
import { SpotReviewBlockIsland } from '@/components/reviews/SpotReviewBlockIsland';
import { RelatedSpots } from '@/components/spots/RelatedSpots';
import { SpotFlowersList } from '@/components/spots/SpotFlowersList';
import { SpotImageGallery } from '@/components/spots/SpotImageGallery';
import { SpotMapPin } from '@/components/spots/SpotMapPin';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CACHE_TAGS, spotTag } from '@/lib/cacheTags';
import { COPY } from '@/lib/constants/copy';
import { getSpotDetail, getSpotMeta, type SpotDetail } from '@/lib/queries/spotDetail';
import { tokyoMonth } from '@/lib/utils/dateUtils';
import { formatSeasonRange, isInBestSeason } from '@/lib/utils/seasonUtils';

// <Link> プリフェッチを効かせる。dynamic segment [id] と ?edit パラメータが
// あり、build 時に全 ID を列挙して samples を埋めるのは現実的でないため、
// バリデーションは無効化してプリフェッチ挙動だけ受け取る。実 sample 列挙は
// 将来 generateStaticParams を導入したら delete できる。
export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ edit?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const meta = await getSpotMeta(id);
  if (!meta) return { title: COPY.spotDetail.metaNotFound };

  const seasonText = formatSeasonRange(meta.bestSeasonStart, meta.bestSeasonEnd);
  const description = COPY.spotDetail.metaDescription({
    name: meta.name,
    prefectureName: meta.prefectureName,
    seasonText,
    description: meta.description,
  });
  const title = COPY.spotDetail.metaTitle(meta.name);

  return {
    title,
    description,
    openGraph: {
      title,
      description: meta.description ?? description,
      type: 'article',
      url: `/spots/${id}`,
      images: meta.coverImageUrl ? [{ url: meta.coverImageUrl }] : undefined,
    },
  };
}

/**
 * スポット詳細ページ。
 *
 * チケット 22 Step 2: getSpotDetail / getUser / bookmark / myReview / tokyoMonth()
 * を Suspense 境界内側に押し下げ、page 本体は sync で外枠 <article> だけを描く
 * 構造にした。dynamic 段（[id]）は params の await を子コンポーネント側に
 * 任せる形（cacheComponents 有効化後の Next.js 流儀に合わせる）。
 */
export default function SpotDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <article className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <Suspense fallback={<SpotDetailSkeleton />}>
        <SpotDetailContent params={params} searchParams={searchParams} />
      </Suspense>
    </article>
  );
}

async function SpotDetailContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id }, { edit }] = await Promise.all([params, searchParams]);
  const cached = await loadSpotBundle(id);
  if (!cached) notFound();
  const { bundle, currentMonth } = cached;

  const { spot, images, flowers, reviews, reviewSummary, relatedSpots } = bundle;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const inSeason = isInBestSeason(spot.bestSeasonStart, spot.bestSeasonEnd, currentMonth);
  const editIntent = edit === 'review';

  return (
    <>
      <SpotJsonLd
        spot={spot}
        coverImageUrl={images[0]?.url ?? null}
        reviewSummary={reviewSummary}
      />

      <header className="mb-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.nav.labels.spots, href: '/spots' },
            { label: spot.name },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {spot.prefectureRegion} ・ {spot.prefectureName}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {spot.name}
          </h1>
          <BookmarkButtonIsland spotId={spot.id} spotName={spot.name} />
        </div>
        {spot.nameKana && <p className="mt-2 text-sm text-ink-muted">{spot.nameKana}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted">
            {COPY.spotDetail.bestSeasonBadge(
              formatSeasonRange(spot.bestSeasonStart, spot.bestSeasonEnd),
            )}
          </span>
          {inSeason && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-3 py-1 text-xs font-medium text-white shadow-sm">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {COPY.spotDetail.inSeasonLabel}
            </span>
          )}
          {flowers.slice(0, 3).map((flower) => (
            <Link
              key={flower.flowerId}
              href={`/flowers/${flower.flowerId}`}
              className="inline-flex items-center rounded-pill bg-surface-2 px-3 py-1 text-xs text-ink-muted transition hover:bg-line"
            >
              {flower.flowerName}
            </Link>
          ))}
        </div>
      </header>

      <SpotImageGallery images={images} spotName={spot.name} />

      {spot.description && (
        <section className="mt-10">
          <p className="whitespace-pre-line text-base leading-7 text-ink">{spot.description}</p>
        </section>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <InfoCard label={COPY.spotDetail.info.address} icon={<MapPinIcon className="size-4" />}>
          {spot.location}
        </InfoCard>
        {spot.accessInfo && (
          <InfoCard label={COPY.spotDetail.info.access}>
            <p className="whitespace-pre-line">{spot.accessInfo}</p>
          </InfoCard>
        )}
        {spot.parkingInfo && (
          <InfoCard label={COPY.spotDetail.info.parking}>
            <p className="whitespace-pre-line">{spot.parkingInfo}</p>
          </InfoCard>
        )}
        {spot.entranceFee && (
          <InfoCard label={COPY.spotDetail.info.entranceFee}>
            <p className="whitespace-pre-line">{spot.entranceFee}</p>
          </InfoCard>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader title={COPY.spotDetail.sections.mapTitle} />
        <div className="mt-4">
          <SpotMapPin
            apiKey={apiKey}
            latitude={spot.latitude}
            longitude={spot.longitude}
            spotName={spot.name}
            location={spot.location}
          />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          title={COPY.spotDetail.sections.flowersTitle}
          eyebrow={COPY.spotDetail.sections.flowersEyebrow}
        />
        <div className="mt-4">
          <SpotFlowersList flowers={flowers} />
        </div>
      </section>

      <MannerNotice />

      {(spot.officialUrl || spot.source) && (
        <section className="mt-10 rounded-card border border-line bg-white p-5 text-sm">
          {spot.officialUrl && (
            <p className="flex items-center gap-2">
              <span className="font-medium">{COPY.spotDetail.references.officialSite}</span>
              <Link
                href={spot.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand hover:text-brand-hover"
              >
                {safeHostname(spot.officialUrl)}
                <ExternalLinkIcon className="size-3.5" />
              </Link>
            </p>
          )}
          {spot.source && (
            <p className="mt-2 text-xs text-ink-muted">
              {COPY.spotDetail.references.sourceLabel(spot.source)}
            </p>
          )}
        </section>
      )}

      <section id="reviews" className="mt-12 scroll-mt-24">
        <SectionHeader
          title={COPY.spotDetail.sections.reviewsTitle}
          eyebrow={COPY.spotDetail.sections.reviewsEyebrow}
        />
        <div className="mt-4 space-y-6">
          <SpotReviewBlockIsland
            spotId={spot.id}
            editIntent={editIntent}
            reviews={reviews}
            summary={reviewSummary}
          />
        </div>
      </section>

      <div className="mt-12">
        <Suspense fallback={<AffiliateHotelSectionSkeleton />}>
          <AffiliateHotelSection latitude={spot.latitude} longitude={spot.longitude} />
        </Suspense>
      </div>

      {relatedSpots.length > 0 && (
        <div className="mt-16">
          <RelatedSpots spots={relatedSpots} />
        </div>
      )}
    </>
  );
}

/**
 * スポット詳細バンドルを cacheComponents の `'use cache'` で hours スケールでキャッシュ。
 * tokyoMonth() を内側で評価することで、月の境界を跨いだ「今が見頃」表示が
 * キャッシュ寿命の範囲で正しく切り替わる。
 */
async function loadSpotBundle(id: string) {
  'use cache';
  cacheLife('hours');
  // 単一スポットの編集 + 全 spots/flowers 系の編集（関連スポット表示）で invalidate されるべき。
  cacheTag(spotTag(id), CACHE_TAGS.spots, CACHE_TAGS.flowers);
  const bundle = await getSpotDetail(id);
  if (!bundle) return null;
  return { bundle, currentMonth: tokyoMonth() };
}

function SpotDetailSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-full max-w-2xl animate-pulse rounded bg-surface-2 md:h-14" />
        <div className="mt-3 h-3 w-32 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="aspect-[16/9] w-full animate-pulse rounded-card-lg bg-surface-2" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
      )}
      <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function InfoCard({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {icon}
        {label}
      </p>
      <div className="mt-2 text-sm leading-6 text-ink">{children}</div>
    </div>
  );
}

function MannerNotice() {
  return (
    <aside className="mt-10 rounded-card border border-line-strong bg-brand-soft/40 p-5">
      <p className="flex items-center gap-2 font-serif text-base font-semibold text-ink">
        <InfoIcon className="size-5 text-brand" />
        {COPY.spotDetail.manner.title}
      </p>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-ink-muted">
        {COPY.spotDetail.manner.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * `official_url` にスキームなし文字列等の不正値が紛れていても 500 にしないためのガード。
 * URL がパースできなければ素の文字列を hostname の代わりに表示する。
 */
function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function SpotJsonLd({
  spot,
  coverImageUrl,
  reviewSummary,
}: {
  spot: SpotDetail;
  coverImageUrl: string | null;
  reviewSummary: { count: number; average: number | null };
}) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: spot.name,
    description: spot.description ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressRegion: spot.prefectureName,
      streetAddress: spot.location,
    },
  };
  if (spot.latitude != null && spot.longitude != null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: spot.latitude,
      longitude: spot.longitude,
    };
  }
  if (coverImageUrl) jsonLd.image = coverImageUrl;
  if (spot.officialUrl) jsonLd.url = spot.officialUrl;
  if (reviewSummary.count > 0 && reviewSummary.average != null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewSummary.average,
      reviewCount: reviewSummary.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
      }}
    />
  );
}
