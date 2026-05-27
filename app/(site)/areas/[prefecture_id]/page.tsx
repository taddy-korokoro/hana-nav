import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AreaMonthlyCalendar } from '@/components/areas/AreaMonthlyCalendar';
import { RelatedAreas } from '@/components/areas/RelatedAreas';
import { ArrowRightIcon } from '@/components/layout/icons';
import { SpotCard } from '@/components/spots/SpotCard';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';
import { getAreaDetail, getPrefecture } from '@/lib/queries/areas';

type Params = Promise<{ prefecture_id: string }>;

// 47 都道府県は ID 1〜47 で固定。Supabase クライアントは cookies() 依存で
// `generateStaticParams` から呼べないので、固定範囲で params を出力する。
export function generateStaticParams() {
  return Array.from({ length: 47 }, (_, i) => ({ prefecture_id: String(i + 1) }));
}

function parsePrefectureId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1 || id > 47) return null;
  return id;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { prefecture_id } = await params;
  const id = parsePrefectureId(prefecture_id);
  if (id == null) return { title: COPY.area.metaNotFound };

  const prefecture = await getPrefecture(id);
  if (!prefecture) return { title: COPY.area.metaNotFound };

  // 件数取得は generateMetadata の追加コストとしては許容範囲（page でも getAreaDetail を引くので
  // React.cache でうまく重複排除できればなお良いが、現状は spots クエリは page 側のみ）。
  // ここでは件数なしの簡易メタにせず、bundle を軽く取り直して件数を含める。
  const detail = await getAreaDetail(id);
  const spotCount = detail?.spots.length ?? 0;

  const title = COPY.area.metaTitle(prefecture.name);
  const description = COPY.area.metaDescription({
    prefectureName: prefecture.name,
    region: prefecture.region,
    spotCount,
  });

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', url: `/areas/${prefecture_id}` },
  };
}

/**
 * エリア（都道府県）詳細ページ。
 *
 * チケット 22 Step 2: getAreaDetail / getPrefecture を Suspense 境界内側に
 * 押し下げ、page 本体は sync で外枠だけを描く。
 */
export default function AreaDetailPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <Suspense fallback={<AreaDetailSkeleton />}>
        <AreaDetailContent params={params} />
      </Suspense>
    </div>
  );
}

async function AreaDetailContent({ params }: { params: Params }) {
  // params 解決後に id ベースで全データを取得する。params は request 由来なので
  // 上位（page 関数）で await する必要があるが、ここでは id を引数として渡せば
  // キャッシュ可能。子関数 AreaBundle に切り出して 'use cache' する。
  const { prefecture_id } = await params;
  const id = parsePrefectureId(prefecture_id);
  if (id == null) notFound();

  const detail = await loadAreaBundle(id);
  if (!detail) notFound();

  const { prefecture, spots, monthly, relatedPrefectures } = detail;

  return (
    <>
      <header className="pb-6 pt-12 md:pt-16">
        <Breadcrumb
          ariaLabel={COPY.area.breadcrumb.aria}
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.nav.labels.spots, href: '/spots' },
            { label: prefecture.region },
            { label: prefecture.name },
          ]}
        />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.area.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {prefecture.name}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          <span className="font-serif text-2xl font-bold text-ink">{spots.length}</span>
          <span className="ml-2">{COPY.area.countSuffix}</span>
        </p>
      </header>

      <section className="mt-10">
        <SectionHeader title={COPY.area.spots.heading} eyebrow={COPY.area.spots.eyebrow} />
        {spots.length === 0 ? (
          <div className="mt-6 rounded-card border border-line bg-white p-10 text-center">
            <p className="font-serif text-lg font-bold">{COPY.area.spots.empty.title}</p>
            <p className="mt-2 text-sm text-ink-muted">{COPY.area.spots.empty.description}</p>
            <Link
              href="/spots"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {COPY.area.spots.empty.cta}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot, i) => (
              <SpotCard key={spot.id} spot={spot} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <SectionHeader title={COPY.area.monthly.heading} eyebrow={COPY.area.monthly.eyebrow} />
        <p className="mt-2 text-sm text-ink-muted">{COPY.area.monthly.description}</p>
        <div className="mt-6">
          <AreaMonthlyCalendar prefectureId={prefecture.id} monthly={monthly} />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeader title={COPY.area.related.heading} eyebrow={COPY.area.related.eyebrow} />
        <p className="mt-2 text-sm text-ink-muted">
          {COPY.area.related.regionLabel(prefecture.region)}
        </p>
        <div className="mt-4">
          <RelatedAreas prefectures={relatedPrefectures} />
        </div>
      </section>
    </>
  );
}

/**
 * 都道府県エリアバンドルを cacheComponents の `'use cache'` で hours スケールで
 * 共有キャッシュする。マスター更新（admin の spot/flower 編集）後はそれぞれの
 * Server Action 側で `revalidateTag('spots' / 'flowers')` を叩いて invalidate する
 * 設計（タグ設計は Step 5 で admin mutations に手を入れる際に合わせて確定）。
 */
async function loadAreaBundle(id: number) {
  'use cache';
  cacheLife('hours');
  return getAreaDetail(id);
}

function AreaDetailSkeleton() {
  return (
    <div>
      <div className="pb-6 pt-12 md:pt-16">
        <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-48 animate-pulse rounded bg-surface-2 md:h-14" />
        <div className="mt-3 h-5 w-24 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] w-full animate-pulse rounded-card bg-surface-2" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}
