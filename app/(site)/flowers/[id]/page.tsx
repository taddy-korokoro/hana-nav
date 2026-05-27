import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { FlowerAttributes } from '@/components/flowers/FlowerAttributes';
import { FlowerImageGallery } from '@/components/flowers/FlowerImageGallery';
import { FlowerSeasonChart } from '@/components/flowers/FlowerSeasonChart';
import { FlowerSpotsList } from '@/components/flowers/FlowerSpotsList';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';
import { type FlowerDetail, getFlowerDetail, getFlowerMeta } from '@/lib/queries/flowers';
import { tokyoMonth } from '@/lib/utils/dateUtils';
import { formatSeasonRange, isInBestSeason } from '@/lib/utils/seasonUtils';

// <Link> プリフェッチを効かせる。dynamic segment [id] があり、build 時に全花 ID を
// 列挙して samples を埋めるのは現実的でないため、バリデーションは無効化して
// プリフェッチ挙動だけ受け取る。将来 generateStaticParams を導入したら delete 可能。
export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const meta = await getFlowerMeta(id);
  if (!meta) return { title: COPY.flowerDetail.metaNotFound };

  const seasonText = formatSeasonRange(meta.defaultSeasonStart, meta.defaultSeasonEnd);
  const description = COPY.flowerDetail.metaDescription({
    name: meta.name,
    seasonText,
    spotCount: meta.spotCount,
    description: meta.description,
  });
  const title = COPY.flowerDetail.metaTitle(meta.name);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/flowers/${id}`,
      images: meta.coverImageUrl ? [{ url: meta.coverImageUrl }] : undefined,
    },
  };
}

/**
 * 花の種類詳細ページ。
 *
 * チケット 22 Step 2: getFlowerDetail / tokyoMonth() を Suspense 境界内側に
 * 押し下げ、page 本体は sync で外枠 <article> だけを描く。
 */
export default function FlowerDetailPage({ params }: { params: Params }) {
  return (
    <article className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <Suspense fallback={<FlowerDetailSkeleton />}>
        <FlowerDetailContent params={params} />
      </Suspense>
    </article>
  );
}

async function FlowerDetailContent({ params }: { params: Params }) {
  const { id } = await params;
  const cached = await loadFlowerBundle(id);
  if (!cached) notFound();
  const { bundle, currentMonth } = cached;

  const { flower, aliases, images, spots } = bundle;
  const seasonText = formatSeasonRange(flower.defaultSeasonStart, flower.defaultSeasonEnd);
  const inSeason =
    flower.defaultSeasonStart != null &&
    flower.defaultSeasonEnd != null &&
    isInBestSeason(flower.defaultSeasonStart, flower.defaultSeasonEnd, currentMonth);

  return (
    <>
      <FlowerJsonLd flower={flower} coverImageUrl={images[0]?.url ?? null} />

      <header className="mb-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.nav.labels.flowers, href: '/flowers' },
            { label: flower.name },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.flowersList.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          {flower.name}
        </h1>
        {flower.nameKana && <p className="mt-2 text-sm text-ink-muted">{flower.nameKana}</p>}

        {seasonText && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted">
              {COPY.flowerDetail.seasonBadge(seasonText)}
            </span>
            {inSeason && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-3 py-1 text-xs font-medium text-white shadow-sm">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {COPY.flowerDetail.inSeasonLabel}
              </span>
            )}
          </div>
        )}
      </header>

      <FlowerImageGallery images={images} flowerName={flower.name} />

      <section className="mt-10">
        <SectionHeader title={COPY.flowerDetail.sections.aboutTitle} />
        <p className="mt-4 whitespace-pre-line text-base leading-7 text-ink">
          {flower.description ?? COPY.flowerDetail.description.empty}
        </p>
      </section>

      <section className="mt-10">
        <SectionHeader
          title={COPY.flowerDetail.sections.seasonTitle}
          eyebrow={COPY.flowerDetail.sections.seasonEyebrow}
        />
        <div className="mt-4">
          <FlowerSeasonChart start={flower.defaultSeasonStart} end={flower.defaultSeasonEnd} />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          title={COPY.flowerDetail.sections.attributesTitle}
          eyebrow={COPY.flowerDetail.sections.attributesEyebrow}
        />
        <div className="mt-4">
          <FlowerAttributes
            cultivationDifficulty={flower.cultivationDifficulty}
            coldTolerance={flower.coldTolerance}
            heatTolerance={flower.heatTolerance}
            shadeTolerance={flower.shadeTolerance}
          />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          title={COPY.flowerDetail.sections.aliasesTitle}
          eyebrow={COPY.flowerDetail.sections.aliasesEyebrow}
        />
        <div className="mt-4">
          {aliases.length === 0 ? (
            <p className="text-sm text-ink-muted">{COPY.flowerDetail.aliases.empty}</p>
          ) : (
            <>
              <p className="text-xs text-ink-faint">
                {COPY.flowerDetail.aliases.summary(aliases.length)}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {aliases.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-pill border border-line bg-white px-3 py-1 text-sm text-ink"
                  >
                    {a.alias}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          title={COPY.flowerDetail.sections.spotsTitle}
          eyebrow={COPY.flowerDetail.sections.spotsEyebrow}
        />
        {spots.length > 0 && (
          <p className="mt-2 text-xs text-ink-faint">
            {COPY.flowerDetail.spots.countSummary(spots.length)}
          </p>
        )}
        <div className="mt-4">
          <FlowerSpotsList spots={spots} />
        </div>
      </section>
    </>
  );
}

/**
 * 花詳細バンドルを cacheComponents の `'use cache'` で hours スケールでキャッシュ。
 * tokyoMonth() を内側で評価することで、月の境界を跨いだ「今が見頃」表示が
 * キャッシュ寿命の範囲で正しく切り替わる。
 */
async function loadFlowerBundle(id: string) {
  'use cache';
  cacheLife('hours');
  const bundle = await getFlowerDetail(id);
  if (!bundle) return null;
  return { bundle, currentMonth: tokyoMonth() };
}

function FlowerDetailSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-64 animate-pulse rounded bg-surface-2 md:h-14" />
      </div>
      <div className="aspect-[16/9] w-full animate-pulse rounded-card-lg bg-surface-2" />
      <div className="mt-10 h-32 animate-pulse rounded-card bg-surface-2" />
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

function FlowerJsonLd({
  flower,
  coverImageUrl,
}: {
  flower: FlowerDetail;
  coverImageUrl: string | null;
}) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: flower.name,
    alternateName: flower.nameKana ?? undefined,
    description: flower.description ?? undefined,
  };
  if (coverImageUrl) jsonLd.image = coverImageUrl;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
      }}
    />
  );
}
