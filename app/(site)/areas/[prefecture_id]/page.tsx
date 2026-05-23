import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AreaBreadcrumb } from '@/components/areas/AreaBreadcrumb';
import { AreaMonthlyCalendar } from '@/components/areas/AreaMonthlyCalendar';
import { RelatedAreas } from '@/components/areas/RelatedAreas';
import { ArrowRightIcon } from '@/components/layout/icons';
import { SpotCard } from '@/components/spots/SpotCard';
import { COPY } from '@/lib/constants/copy';
import { getAreaDetail, getPrefecture } from '@/lib/queries/areas';

type Params = Promise<{ prefecture_id: string }>;

// 中身（spots/calendar）は `revalidate` で定期更新する。週次でも十分（マスター更新が稀なため）。
// 注：page 側で Supabase の cookies() を使うため実体は dynamic レンダリングだが、
// CDN キャッシュ層で revalidate は機能する。
export const revalidate = 604800; // 7 days

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

export default async function AreaDetailPage({ params }: { params: Params }) {
  const { prefecture_id } = await params;
  const id = parsePrefectureId(prefecture_id);
  if (id == null) notFound();

  const detail = await getAreaDetail(id);
  if (!detail) notFound();

  const { prefecture, spots, monthly, relatedPrefectures } = detail;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <header className="pb-6 pt-12 md:pt-16">
        <AreaBreadcrumb region={prefecture.region} prefectureName={prefecture.name} />
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
