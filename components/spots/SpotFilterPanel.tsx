import Link from 'next/link';
import { SearchIcon } from '@/components/layout/icons';
import {
  type PrefectureGroup,
  type SortKey,
  type SpotSearchParams,
  type ViewKey,
  serializeSpotSearchParams,
} from '@/lib/queries/spotSearch';

type Props = {
  current: SpotSearchParams;
  prefectureGroups: PrefectureGroup[];
  flowers: { id: string; name: string }[];
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * `/spots` のフィルタ + 検索 + ソート + ビュー切替。
 * すべて URL `searchParams` ベースなので Server Component で完結する。
 * 1 つだけ `<form action="/spots" method="get">` を使ってフリーワード入力を受ける。
 */
export function SpotFilterPanel({ current, prefectureGroups, flowers }: Props) {
  const buildHref = (next: Partial<SpotSearchParams>) => {
    const merged: SpotSearchParams = { ...current, ...next, page: 1 };
    const qs = serializeSpotSearchParams(merged);
    return qs ? `/spots?${qs}` : '/spots';
  };

  return (
    <section className="space-y-5 pb-8">
      <form
        action="/spots"
        method="get"
        className="flex gap-2 rounded-card border border-line bg-white p-2 shadow-sm"
      >
        <label className="flex flex-1 items-center gap-3 px-3">
          <SearchIcon className="size-5 text-ink-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={current.q ?? ''}
            placeholder="スポット名・キーワードで検索"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-ink-faint"
          />
        </label>
        <SubmitWithHidden current={current} />
      </form>

      <FilterRow
        label="エリア"
        items={[
          ...prefectureGroups.flatMap((g) =>
            g.prefectures.map((p) => ({
              key: `pref-${p.id}`,
              label: p.name,
              selected: current.prefecture === p.id,
              href: buildHref({
                prefecture: current.prefecture === p.id ? undefined : p.id,
                region: undefined,
              }),
            })),
          ),
        ]}
      />

      <FilterRow
        label="地方"
        items={UNIQUE_REGIONS(prefectureGroups).map((r) => ({
          key: `region-${r}`,
          label: r,
          selected: current.region === r && !current.prefecture,
          href: buildHref({
            region: current.region === r ? undefined : r,
            prefecture: undefined,
          }),
        }))}
      />

      <FilterRow
        label="時期"
        items={MONTHS.map((m) => ({
          key: `month-${m}`,
          label: `${m}月`,
          selected: current.month === m,
          href: buildHref({ month: current.month === m ? undefined : m }),
        }))}
      />

      <FilterRow
        label="花"
        items={flowers.map((f) => ({
          key: `flower-${f.id}`,
          label: f.name,
          selected: current.flower === f.name,
          href: buildHref({ flower: current.flower === f.name ? undefined : f.name }),
        }))}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          並び順
        </span>
        <SortChip current={current} value="newest" label="新着順" buildHref={buildHref} />
        <SortChip current={current} value="name" label="名前順" buildHref={buildHref} />
        <SortChip current={current} value="prefecture" label="都道府県順" buildHref={buildHref} />

        <span className="mx-2 hidden h-5 w-px bg-line sm:inline-block" aria-hidden />

        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          表示
        </span>
        <ViewChip current={current} value="list" label="リスト" buildHref={buildHref} />
        <ViewChip current={current} value="map" label="マップ" buildHref={buildHref} />
      </div>
    </section>
  );
}

function FilterRow({
  label,
  items,
}: {
  label: string;
  items: { key: string; label: string; selected: boolean; href: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </p>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            className={
              it.selected
                ? 'shrink-0 rounded-pill border border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-brand'
                : 'shrink-0 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white'
            }
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SortChip({
  current,
  value,
  label,
  buildHref,
}: {
  current: SpotSearchParams;
  value: SortKey;
  label: string;
  buildHref: (next: Partial<SpotSearchParams>) => string;
}) {
  const selected = (current.sort ?? 'newest') === value;
  return (
    <Link
      href={buildHref({ sort: value })}
      aria-current={selected ? 'true' : undefined}
      className={
        selected
          ? 'rounded-pill border border-brand bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand'
          : 'rounded-pill border border-line bg-white px-3 py-1.5 text-xs transition hover:border-ink hover:bg-ink hover:text-white'
      }
    >
      {label}
    </Link>
  );
}

function ViewChip({
  current,
  value,
  label,
  buildHref,
}: {
  current: SpotSearchParams;
  value: ViewKey;
  label: string;
  buildHref: (next: Partial<SpotSearchParams>) => string;
}) {
  const selected = (current.view ?? 'list') === value;
  return (
    <Link
      href={buildHref({ view: value })}
      aria-current={selected ? 'true' : undefined}
      className={
        selected
          ? 'rounded-pill border border-brand bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand'
          : 'rounded-pill border border-line bg-white px-3 py-1.5 text-xs transition hover:border-ink hover:bg-ink hover:text-white'
      }
    >
      {label}
    </Link>
  );
}

function SubmitWithHidden({ current }: { current: SpotSearchParams }) {
  // q 以外の絞り込みは form 送信でも維持したいので hidden input で持ち込む
  return (
    <>
      {current.prefecture ? (
        <input type="hidden" name="prefecture" value={current.prefecture} />
      ) : null}
      {current.region ? <input type="hidden" name="region" value={current.region} /> : null}
      {current.flower ? <input type="hidden" name="flower" value={current.flower} /> : null}
      {current.month ? <input type="hidden" name="month" value={current.month} /> : null}
      {current.sort && current.sort !== 'newest' ? (
        <input type="hidden" name="sort" value={current.sort} />
      ) : null}
      {current.view && current.view !== 'list' ? (
        <input type="hidden" name="view" value={current.view} />
      ) : null}
      <button
        type="submit"
        className="flex items-center gap-2 rounded-card bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        <SearchIcon className="size-4" />
        検索
      </button>
    </>
  );
}

function UNIQUE_REGIONS(groups: PrefectureGroup[]): string[] {
  return Array.from(new Set(groups.map((g) => g.region)));
}
