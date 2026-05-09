import Link from 'next/link';
import {
  CalendarIcon,
  CameraIcon,
  FlowerIcon,
  MapPinIcon,
  SearchIcon,
} from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';

/**
 * トップ用の検索バー。MVP の段階ではキーワード検索 UI は持たず、3 つのフィールドは
 * クイックリンクとして `/spots`（month クエリ付き）, `/spots`, `/flowers` に飛ばす。
 * フィールドの本格的な絞り込み入力はチケット 06 のスポット検索ページで実装する。
 */
export function SearchBar({ currentMonth }: { currentMonth: number }) {
  const monthLabel = COPY.common.months.ja[currentMonth] ?? '';
  return (
    <div className="mt-8 space-y-3">
      <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-2 shadow-sm sm:flex-row sm:items-stretch">
        <Link
          href="/spots"
          className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface"
        >
          <MapPinIcon className="size-5 text-ink-muted" />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink-muted">
              {COPY.home.searchBar.area}
            </span>
            <span className="block text-sm">{COPY.home.searchBar.areaPlaceholder}</span>
          </span>
        </Link>
        <span className="hidden w-px self-stretch bg-line sm:block" />
        <Link
          href={`/spots?month=${currentMonth}`}
          className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface"
        >
          <CalendarIcon className="size-5 text-ink-muted" />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink-muted">
              {COPY.home.searchBar.season}
            </span>
            <span className="block text-sm">{monthLabel}</span>
          </span>
        </Link>
        <span className="hidden w-px self-stretch bg-line sm:block" />
        <Link
          href="/flowers"
          className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface"
        >
          <FlowerIcon className="size-5 text-ink-muted" />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink-muted">
              {COPY.home.searchBar.flower}
            </span>
            <span className="block text-sm">{COPY.home.searchBar.flowerPlaceholder}</span>
          </span>
        </Link>
        <Link
          href="/spots"
          className="flex items-center justify-center gap-2 rounded-card bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          <SearchIcon className="size-4" />
          {COPY.common.search}
        </Link>
      </div>

      <Link
        href="/identify"
        className="group inline-flex items-center gap-2 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong"
      >
        <CameraIcon className="size-4 text-ink-muted transition group-hover:text-brand" />
        {COPY.home.searchBar.identifyCta}
        <span aria-hidden className="text-brand">
          →
        </span>
      </Link>
    </div>
  );
}
