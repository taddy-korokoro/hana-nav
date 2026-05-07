import Link from 'next/link';
import { BookmarkButton } from './_components/bookmark-button';
import { DemoNav } from './_components/demo-nav';
import {
  ArrowRightIcon,
  CalendarIcon,
  FlowerIcon,
  MapPinIcon,
  SearchIcon,
} from './_components/icons';
import { SiteFooter } from './_components/site-footer';
import { SiteHeader } from './_components/site-header';

export const metadata = {
  title: 'Hana Nav — Travel Style Demo',
};

const seasonal = [
  {
    name: '藤',
    area: '栃木 / 福岡',
    peak: '4月下旬〜5月上旬',
    grad: 'from-violet-300 via-purple-200 to-fuchsia-100',
  },
  {
    name: 'つつじ',
    area: '東京 / 群馬',
    peak: '5月上旬',
    grad: 'from-pink-300 via-rose-200 to-orange-100',
  },
  {
    name: '牡丹',
    area: '島根 / 奈良',
    peak: '5月上旬',
    grad: 'from-rose-300 via-pink-200 to-amber-100',
  },
  {
    name: '菖蒲',
    area: '千葉 / 三重',
    peak: '5月下旬〜6月上旬',
    grad: 'from-indigo-300 via-violet-200 to-blue-100',
  },
  {
    name: 'バラ',
    area: '東京 / 神奈川',
    peak: '5月中旬',
    grad: 'from-red-300 via-rose-200 to-pink-100',
  },
  {
    name: 'ポピー',
    area: '千葉 / 埼玉',
    peak: '5月中旬',
    grad: 'from-orange-300 via-amber-200 to-yellow-100',
  },
];

const editorialPick = {
  title: '藤の天蓋に包まれて',
  subtitle: 'あしかがフラワーパーク',
  prefecture: '栃木県足利市',
  peak: '4月中旬 — 5月中旬',
  description:
    '樹齢160年の大藤が紫の屋根を架ける。日没後のライトアップは、昼とは別世界の表情を見せる。',
  grad: 'from-violet-400 via-purple-300 to-fuchsia-200',
  glyph: '藤',
};

const featured = [
  {
    title: '桜の名所 ベスト10',
    subtitle: '東京・京都を中心に',
    grad: 'from-pink-300 via-rose-200 to-orange-100',
    glyph: '桜',
  },
  {
    title: 'ネモフィラの青の丘',
    subtitle: '関東・茨城の春',
    grad: 'from-sky-300 via-blue-200 to-cyan-100',
    glyph: '青',
  },
];

const flowerChips = [
  '桜',
  '向日葵',
  '紫陽花',
  'コスモス',
  '藤',
  '牡丹',
  '菖蒲',
  '梅',
  '彼岸花',
  'ポピー',
  'チューリップ',
  'ラベンダー',
];

const popularSpots = [
  {
    name: '新宿御苑',
    prefecture: '東京都',
    flower: '桜・八重桜',
    peak: '3月下旬〜4月中旬',
    grad: 'from-pink-300 to-rose-200',
    glyph: '桜',
  },
  {
    name: 'ひたち海浜公園',
    prefecture: '茨城県',
    flower: 'ネモフィラ',
    peak: '4月下旬〜5月上旬',
    grad: 'from-sky-300 to-blue-200',
    glyph: '青',
  },
  {
    name: '富士芝桜まつり',
    prefecture: '山梨県',
    flower: '芝桜',
    peak: '4月中旬〜5月下旬',
    grad: 'from-rose-300 to-pink-100',
    glyph: '芝',
  },
  {
    name: '亀戸天神社',
    prefecture: '東京都',
    flower: '藤',
    peak: '4月下旬〜5月上旬',
    grad: 'from-violet-300 to-purple-200',
    glyph: '藤',
  },
  {
    name: 'ファーム富田',
    prefecture: '北海道',
    flower: 'ラベンダー',
    peak: '7月上旬〜中旬',
    grad: 'from-indigo-300 to-violet-200',
    glyph: '薫',
  },
  {
    name: '国営昭和記念公園',
    prefecture: '東京都',
    flower: 'コスモス',
    peak: '10月上旬〜中旬',
    grad: 'from-fuchsia-300 to-pink-200',
    glyph: '秋',
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <DemoNav current="/demo" />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pb-10 pt-12 md:pb-16 md:pt-20">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
            Find your bloom
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-6xl">
            満開を、見逃さない。
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            全国の花畑スポットを、エリア・季節・花の種類から探せます。今が見頃の場所も、来月の予習も。
          </p>

          <div className="mt-8 flex flex-col gap-2 rounded-card border border-line bg-white p-2 shadow-sm sm:flex-row sm:items-stretch">
            <button
              type="button"
              className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface"
            >
              <MapPinIcon className="size-5 text-muted" />
              <span className="flex-1">
                <span className="block text-xs font-semibold text-muted">エリア</span>
                <span className="block text-sm">どこで見たい？</span>
              </span>
            </button>
            <span className="hidden w-px self-stretch bg-line sm:block" />
            <button
              type="button"
              className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface"
            >
              <CalendarIcon className="size-5 text-muted" />
              <span className="flex-1">
                <span className="block text-xs font-semibold text-muted">時期</span>
                <span className="block text-sm">5月</span>
              </span>
            </button>
            <span className="hidden w-px self-stretch bg-line sm:block" />
            <button
              type="button"
              className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface"
            >
              <FlowerIcon className="size-5 text-muted" />
              <span className="flex-1">
                <span className="block text-xs font-semibold text-muted">花</span>
                <span className="block text-sm">何を見たい？</span>
              </span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-card bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <SearchIcon className="size-4" />
              検索
            </button>
          </div>
        </section>

        <section className="pt-8">
          <SectionHeader eyebrow="May 2026" title="今月の見頃" linkLabel="すべて見る" />
          <div className="-mx-6 mt-6 flex gap-4 overflow-x-auto px-6 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {seasonal.map((f) => (
              <Link key={f.name} href="#" className="group shrink-0">
                <div
                  className={`relative h-56 w-44 overflow-hidden rounded-card bg-gradient-to-br ${f.grad}`}
                >
                  <span className="absolute inset-0 grid place-items-center text-7xl font-light text-white/70">
                    {f.name.slice(0, 1)}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent p-4">
                    <p className="font-serif text-lg font-semibold text-white">{f.name}</p>
                    <p className="text-xs text-white/85">{f.peak}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">{f.area}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="pt-16">
          <SectionHeader eyebrow="Editorial" title="編集部のおすすめ" />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Link
              href="#"
              className="group relative col-span-1 overflow-hidden rounded-card-lg lg:col-span-2"
            >
              <div className={`relative aspect-[16/9] bg-gradient-to-br ${editorialPick.grad}`}>
                <span className="absolute inset-0 grid place-items-center text-[280px] font-light leading-none text-white/55">
                  {editorialPick.glyph}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/85">
                    {editorialPick.peak}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-white md:text-4xl">
                    {editorialPick.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/90">
                    {editorialPick.subtitle} ・ {editorialPick.prefecture}
                  </p>
                  <p className="mt-3 max-w-md text-sm text-white/85">{editorialPick.description}</p>
                </div>
                <div className="absolute right-4 top-4">
                  <BookmarkButton initial size="lg" />
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {featured.map((f) => (
                <Link key={f.title} href="#" className="group block">
                  <div
                    className={`relative aspect-[5/4] overflow-hidden rounded-card bg-gradient-to-br ${f.grad}`}
                  >
                    <span className="absolute inset-0 grid place-items-center text-[120px] font-light leading-none text-white/60">
                      {f.glyph}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h4 className="font-serif text-lg font-semibold text-white">{f.title}</h4>
                      <p className="text-xs text-white/85">{f.subtitle}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-16">
          <SectionHeader title="花から探す" />
          <div className="mt-5 flex flex-wrap gap-2">
            {flowerChips.map((c) => (
              <Link
                key={c}
                href="#"
                className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>

        <section className="pt-16">
          <SectionHeader eyebrow="Popular" title="人気のスポット" linkLabel="すべて見る" />
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popularSpots.map((s, i) => (
              <Link key={s.name} href="#" className="group">
                <div
                  className={`relative aspect-[4/3] overflow-hidden rounded-card bg-gradient-to-br ${s.grad}`}
                >
                  <span className="absolute inset-0 grid place-items-center text-[120px] font-light leading-none text-white/60">
                    {s.glyph}
                  </span>
                  <div className="absolute right-3 top-3">
                    <BookmarkButton initial={i === 1} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted">
                      {s.prefecture} ・ {s.flower}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">{s.peak}</p>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-faint transition group-hover:translate-x-1 group-hover:text-ink" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {linkLabel && (
        <Link
          href="#"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink hover:text-brand"
        >
          {linkLabel}
          <ArrowRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
