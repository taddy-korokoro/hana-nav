import { Search } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';
import {
  type PrefectureGroup,
  type SortKey,
  type SpotSearchParams,
  type ViewKey,
  serializeSpotSearchParams,
} from '@/lib/queries/spotSearch';

import { ActiveFilterChips } from './ActiveFilterChips';
import { SearchableSelect, type SearchableOption } from './SearchableSelect';

type Props = {
  current: SpotSearchParams;
  prefectureGroups: PrefectureGroup[];
  flowers: { id: string; name: string }[];
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * `/spots` の検索 + フィルタ + ソート + ビュー。
 * - キーワード検索を画面上部に大きく配置
 * - アクティブフィルタを ×削除可能チップで集約
 * - 詳細条件は <details> で折りたたみ（フィルタ適用中は open）
 * - 都道府県・花は検索可能ドロップダウン（SearchableSelect = Client Component）
 */
export function SpotSearchPanel({ current, prefectureGroups, flowers }: Props) {
  const buildHref = (next: Partial<SpotSearchParams>): string => {
    const merged: SpotSearchParams = { ...current, ...next, page: 1 };
    const qs = serializeSpotSearchParams(merged);
    return qs ? `/spots?${qs}` : '/spots';
  };

  const regions = uniqueRegions(prefectureGroups);

  const prefectureOptions: SearchableOption[] = prefectureGroups.flatMap((g) =>
    g.prefectures.map((p) => ({
      value: String(p.id),
      label: p.name,
      href: buildHref({ prefecture: p.id, region: undefined }),
    })),
  );

  const flowerOptions: SearchableOption[] = flowers.map((f) => ({
    value: f.name,
    label: f.name,
    href: buildHref({ flower: f.name }),
  }));

  const regionOptions: SearchableOption[] = regions.map((r) => ({
    value: r,
    label: r,
    href: buildHref({ region: r, prefecture: undefined }),
  }));

  const monthOptions: SearchableOption[] = MONTHS.map((m) => ({
    value: String(m),
    label: COPY.common.months.ja[m],
    href: buildHref({ month: m }),
  }));

  return (
    <section className="space-y-5 pb-8">
      {/* キーワード検索（最上段・大きく） */}
      <form
        action="/spots"
        method="get"
        role="search"
        className="flex items-center gap-2 rounded-card-lg border border-line bg-white p-2 shadow-sm transition-colors focus-within:border-line-strong"
      >
        <Search className="ml-3 size-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={current.q ?? ''}
          placeholder={COPY.spotsList.filter.keywordPlaceholder}
          className="w-full bg-transparent py-3 text-base outline-none placeholder:text-ink-faint"
        />
        <HiddenSearchState current={current} />
        <Button type="submit" size="md" className="shrink-0">
          <Search className="size-4" aria-hidden />
          {COPY.common.search}
        </Button>
      </form>

      {/* アクティブフィルタ */}
      <ActiveFilterChips current={current} prefectureGroups={prefectureGroups} />

      {/* フィルタ条件（常時表示） */}
      <div className="grid gap-4 rounded-card border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <SearchableSelect
          label={COPY.spotsList.filter.region}
          options={regionOptions}
          clearHref={buildHref({ region: undefined })}
          selectedValue={current.region ?? null}
        />
        <SearchableSelect
          label={COPY.spotsList.filter.area}
          options={prefectureOptions}
          clearHref={buildHref({ prefecture: undefined })}
          selectedValue={current.prefecture ? String(current.prefecture) : null}
        />
        <SearchableSelect
          label={COPY.spotsList.filter.season}
          options={monthOptions}
          clearHref={buildHref({ month: undefined })}
          selectedValue={current.month ? String(current.month) : null}
        />
        <SearchableSelect
          label={COPY.spotsList.filter.flower}
          options={flowerOptions}
          clearHref={buildHref({ flower: undefined })}
          selectedValue={current.flower ?? null}
        />
      </div>

      {/* ソート + ビュー切替（結果上部の右肩） */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          {COPY.spotsList.filter.sortHeading}
        </span>
        {(['newest', 'name', 'prefecture'] as SortKey[]).map((s) => (
          <ChipLink
            key={s}
            selected={(current.sort ?? 'newest') === s}
            href={buildHref({ sort: s })}
          >
            {COPY.spotsList.filter.sort[s]}
          </ChipLink>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          {COPY.spotsList.filter.viewHeading}
        </span>
        {(['list', 'map'] as ViewKey[]).map((v) => (
          <ChipLink key={v} selected={(current.view ?? 'list') === v} href={buildHref({ view: v })}>
            {COPY.spotsList.filter.view[v]}
          </ChipLink>
        ))}
      </div>
    </section>
  );
}

function ChipLink({
  selected,
  href,
  children,
}: {
  selected: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'true' : undefined}
      className={
        selected
          ? 'rounded-pill border border-brand bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand'
          : 'rounded-pill border border-line bg-white px-3 py-1.5 text-xs transition-colors hover:border-ink hover:bg-ink hover:text-white'
      }
    >
      {children}
    </Link>
  );
}

/**
 * キーワード検索フォームの送信時に、q 以外の絞り込み（prefecture/region/month/flower/sort/view）を
 * 維持するための hidden input 群。
 */
function HiddenSearchState({ current }: { current: SpotSearchParams }) {
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
    </>
  );
}

function uniqueRegions(groups: PrefectureGroup[]): string[] {
  return Array.from(new Set(groups.map((g) => g.region)));
}
