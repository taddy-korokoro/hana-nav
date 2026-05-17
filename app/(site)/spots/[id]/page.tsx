import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { ExternalLinkIcon, InfoIcon, MapPinIcon } from '@/components/layout/icons';
import { RelatedSpots } from '@/components/spots/RelatedSpots';
import { SpotFlowersList } from '@/components/spots/SpotFlowersList';
import { SpotImageGallery } from '@/components/spots/SpotImageGallery';
import { SpotMapPin } from '@/components/spots/SpotMapPin';
import { SpotReviewSection } from '@/components/spots/SpotReviewSection';
import { SpotReviewInteraction } from '@/components/reviews/SpotReviewInteraction';
import { COPY } from '@/lib/constants/copy';
import { isBookmarked } from '@/lib/queries/bookmarks';
import { getMyReviewForSpot } from '@/lib/queries/reviews';
import { getSpotDetail, getSpotMeta, type SpotDetail } from '@/lib/queries/spotDetail';
import { createClient } from '@/lib/supabase/server';
import { formatSeasonRange, isInBestSeason } from '@/lib/utils/seasonUtils';

export const dynamic = 'force-dynamic';

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
      images: meta.coverImageUrl ? [{ url: meta.coverImageUrl }] : undefined,
    },
  };
}

export default async function SpotDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id }, { edit }] = await Promise.all([params, searchParams]);
  const bundle = await getSpotDetail(id);
  if (!bundle) notFound();

  const { spot, images, flowers, reviews, reviewSummary, relatedSpots } = bundle;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [bookmarked, myReview] = user
    ? await Promise.all([isBookmarked(user.id, spot.id), getMyReviewForSpot(user.id, spot.id)])
    : [false, null];

  const myReviewInitial = myReview
    ? {
        reviewId: myReview.id,
        rating: myReview.rating,
        comment: myReview.comment ?? '',
        visitedAt: myReview.visitedAt ?? '',
      }
    : null;

  const currentMonth = new Date().getMonth() + 1;
  const inSeason = isInBestSeason(spot.bestSeasonStart, spot.bestSeasonEnd, currentMonth);

  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:pt-12">
      <SpotJsonLd spot={spot} coverImageUrl={images[0]?.url ?? null} />

      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {spot.prefectureRegion} ・ {spot.prefectureName}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {spot.name}
          </h1>
          <BookmarkButton
            spotId={spot.id}
            spotName={spot.name}
            isAuthenticated={!!user}
            initialBookmarked={bookmarked}
            redirectAfterLogin={`/spots/${spot.id}`}
          />
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
          <SpotReviewInteraction
            spotId={spot.id}
            isAuthenticated={!!user}
            myReview={myReviewInitial}
            defaultOpen={edit === 'review' && !!myReviewInitial}
          />
          <SpotReviewSection
            reviews={reviews}
            summary={reviewSummary}
            myReviewId={myReview?.id ?? null}
          />
        </div>
      </section>

      {relatedSpots.length > 0 && (
        <div className="mt-16">
          <RelatedSpots spots={relatedSpots} />
        </div>
      )}
    </article>
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

function SpotJsonLd({ spot, coverImageUrl }: { spot: SpotDetail; coverImageUrl: string | null }) {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
