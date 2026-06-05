import Link from 'next/link';
import { Suspense } from 'react';
import { BookmarkButton } from '../_components/bookmark-button';
import { DemoNav } from '../_components/demo-nav';
import { ArrowRightIcon } from '../_components/icons';
import { SiteFooter } from '../_components/site-footer';
import { SiteHeader } from '../_components/site-header';

export const metadata = {
  title: 'スポットを探す | Hana Nav',
};

const PREFS = ['北海道', '東京', '京都', '茨城', '山梨', '栃木', '福岡'];
const FLOWERS = ['桜', 'ネモフィラ', '藤', 'ラベンダー', 'コスモス', '紫陽花', '向日葵', '梅'];
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

type Spot = {
  id: string;
  name: string;
  pref: string;
  flower: string;
  months: number[];
  peak: string;
  overview: string;
  grad: string;
  glyph: string;
};

const SPOTS: Spot[] = [
  {
    id: 'shinjuku-gyoen',
    name: '新宿御苑',
    pref: '東京',
    flower: '桜',
    months: [3, 4],
    peak: '3月下旬〜4月中旬',
    overview: '都心の桜の名所。八重桜は4月中旬まで楽しめる。',
    grad: 'from-pink-300 to-rose-200',
    glyph: '桜',
  },
  {
    id: 'hitachi-seaside',
    name: 'ひたち海浜公園',
    pref: '茨城',
    flower: 'ネモフィラ',
    months: [4, 5],
    peak: '4月下旬〜5月上旬',
    overview: '丘一面の青の絶景。GW頃が見頃。',
    grad: 'from-sky-300 to-blue-200',
    glyph: '青',
  },
  {
    id: 'fuji-shibazakura',
    name: '富士芝桜まつり',
    pref: '山梨',
    flower: '芝桜',
    months: [4, 5],
    peak: '4月中旬〜5月下旬',
    overview: '富士山を背景にしたピンクの絨毯。',
    grad: 'from-rose-300 to-pink-100',
    glyph: '芝',
  },
  {
    id: 'kameido-tenjin',
    name: '亀戸天神社',
    pref: '東京',
    flower: '藤',
    months: [4, 5],
    peak: '4月下旬〜5月上旬',
    overview: 'GWに花房が太鼓橋に映える。',
    grad: 'from-violet-300 to-purple-200',
    glyph: '藤',
  },
  {
    id: 'farm-tomita',
    name: 'ファーム富田',
    pref: '北海道',
    flower: 'ラベンダー',
    months: [7],
    peak: '7月上旬〜中旬',
    overview: '富良野の代名詞。空と紫の対比が美しい。',
    grad: 'from-indigo-300 to-violet-200',
    glyph: '薫',
  },
  {
    id: 'showa-kinen',
    name: '国営昭和記念公園',
    pref: '東京',
    flower: 'コスモス',
    months: [10],
    peak: '10月上旬〜中旬',
    overview: '550万本のコスモスが秋の空に揺れる。',
    grad: 'from-fuchsia-300 to-pink-200',
    glyph: '秋',
  },
  {
    id: 'meguro-river',
    name: '目黒川',
    pref: '東京',
    flower: '桜',
    months: [3, 4],
    peak: '3月下旬〜4月上旬',
    overview: '川沿い4kmの桜並木。夜桜の提灯が名物。',
    grad: 'from-pink-300 to-rose-200',
    glyph: '桜',
  },
  {
    id: 'fukuoka-himawari',
    name: '柳川ひまわり園',
    pref: '福岡',
    flower: '向日葵',
    months: [7, 8],
    peak: '7月下旬〜8月上旬',
    overview: '見渡す限りの向日葵畑。夏の風物詩。',
    grad: 'from-amber-300 to-yellow-200',
    glyph: '夏',
  },
  {
    id: 'maruyama-park',
    name: '円山公園',
    pref: '京都',
    flower: '桜',
    months: [3, 4],
    peak: '3月下旬〜4月上旬',
    overview: '祇園しだれの1本桜が象徴。',
    grad: 'from-pink-300 to-rose-200',
    glyph: '桜',
  },
  {
    id: 'ashikaga-flower',
    name: 'あしかがフラワーパーク',
    pref: '栃木',
    flower: '藤',
    months: [4, 5],
    peak: '4月中旬〜5月中旬',
    overview: '樹齢160年の大藤。夜のライトアップ必見。',
    grad: 'from-violet-400 to-purple-200',
    glyph: '藤',
  },
  {
    id: 'okutama-ume',
    name: '青梅 吉野梅郷',
    pref: '東京',
    flower: '梅',
    months: [2, 3],
    peak: '2月下旬〜3月中旬',
    overview: '丘陵地に並ぶ紅白梅。早春の名所。',
    grad: 'from-red-200 to-rose-100',
    glyph: '梅',
  },
  {
    id: 'biei-shikisai',
    name: '美瑛 四季彩の丘',
    pref: '北海道',
    flower: 'ラベンダー',
    months: [6, 7, 8],
    peak: '6月〜9月（花により変動）',
    overview: '丘一面の花のパッチワーク。',
    grad: 'from-emerald-300 to-teal-200',
    glyph: '丘',
  },
];

type SearchParamsShape = {
  pref?: string;
  month?: string;
  flower?: string;
};

export default function SpotsPage({ searchParams }: { searchParams: Promise<SearchParamsShape> }) {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <DemoNav current="/demo/spots" />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pb-6 pt-12 md:pt-16">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Browse spots</p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
            スポットを探す
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
            エリア・時期・花の種類でフィルター。複数組み合わせ可能。
          </p>
        </section>

        <Suspense fallback={<SpotsFiltersSkeleton />}>
          <SpotsFiltersAndList searchParams={searchParams} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}

async function SpotsFiltersAndList({ searchParams }: { searchParams: Promise<SearchParamsShape> }) {
  const params = await searchParams;
  const selPref = params.pref;
  const selMonth = params.month ? Number(params.month) : undefined;
  const selFlower = params.flower;

  const filtered = SPOTS.filter((s) => {
    if (selPref && s.pref !== selPref) return false;
    if (selMonth && !s.months.includes(selMonth)) return false;
    if (selFlower && s.flower !== selFlower) return false;
    return true;
  });

  const buildHref = (next: Partial<SearchParamsShape>) => {
    const merged: SearchParamsShape = {
      pref: selPref,
      month: params.month,
      flower: selFlower,
      ...next,
    };
    const sp = new URLSearchParams();
    if (merged.pref) sp.set('pref', merged.pref);
    if (merged.month) sp.set('month', merged.month);
    if (merged.flower) sp.set('flower', merged.flower);
    const qs = sp.toString();
    return qs ? `/demo/spots?${qs}` : '/demo/spots';
  };

  const hasFilter = Boolean(selPref || selMonth || selFlower);

  return (
    <>
      <section className="space-y-5 pb-8">
        <FilterRow
          label="エリア"
          options={PREFS}
          selected={selPref}
          buildHref={(v) => buildHref({ pref: v === selPref ? undefined : v })}
        />
        <FilterRow
          label="時期"
          options={MONTH_LABELS}
          selected={selMonth ? `${selMonth}月` : undefined}
          buildHref={(v) => {
            const m = Number(v.replace('月', ''));
            return buildHref({
              month: m === selMonth ? undefined : String(m),
            });
          }}
        />
        <FilterRow
          label="花"
          options={FLOWERS}
          selected={selFlower}
          buildHref={(v) => buildHref({ flower: v === selFlower ? undefined : v })}
        />
      </section>

      <section className="flex items-baseline justify-between border-t border-line pt-6">
        <p className="text-sm text-ink-muted">
          <span className="font-serif text-2xl font-bold text-ink">{filtered.length}</span>
          <span className="ml-2">件 / 全 {SPOTS.length} 件</span>
        </p>
        {hasFilter && (
          <Link href="/demo/spots" className="text-xs font-medium text-ink-muted hover:text-ink">
            フィルターをクリア
          </Link>
        )}
      </section>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold">該当するスポットがありません</p>
          <p className="mt-2 text-sm text-ink-muted">
            フィルターを絞りすぎている可能性があります。条件を変えてもう一度お試しください。
          </p>
          <Link
            href="/demo/spots"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            フィルターをクリア
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <Link key={s.id} href={`/demo/spots/${s.id}`} className="group">
              <div
                className={`relative aspect-[4/3] overflow-hidden rounded-card bg-gradient-to-br ${s.grad}`}
              >
                <span className="absolute inset-0 grid place-items-center text-[120px] font-light leading-none text-white/60">
                  {s.glyph}
                </span>
                <span className="absolute bottom-3 left-3 rounded-pill bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
                  {s.flower}
                </span>
                <div className="absolute right-3 top-3">
                  <BookmarkButton initial={i === 1} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {s.pref} ・ {s.flower}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">{s.peak}</p>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function SpotsFiltersSkeleton() {
  return (
    <>
      <div className="space-y-5 pb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-pill bg-surface-2" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </>
  );
}

function FilterRow({
  label,
  options,
  selected,
  buildHref,
}: {
  label: string;
  options: string[];
  selected: string | undefined;
  buildHref: (value: string) => string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </p>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <Link
              key={opt}
              href={buildHref(opt)}
              className={
                isSelected
                  ? 'shrink-0 rounded-pill border border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-brand'
                  : 'shrink-0 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white'
              }
            >
              {opt}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
