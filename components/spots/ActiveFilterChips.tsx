import { X } from 'lucide-react';
import Link from 'next/link';

import { COPY } from '@/lib/constants/copy';
import {
  type PrefectureGroup,
  type SpotSearchParams,
  serializeSpotSearchParams,
} from '@/lib/queries/spotSearch';

type Props = {
  current: SpotSearchParams;
  prefectureGroups: PrefectureGroup[];
};

/**
 * 現在適用中のフィルタを「× で削除可能なチップ」として並べる。
 * 1 つも適用されていなければ何も描画しない。
 */
export function ActiveFilterChips({ current, prefectureGroups }: Props) {
  const hrefWithout = (next: Partial<SpotSearchParams>) => {
    const merged: SpotSearchParams = { ...current, ...next, page: 1 };
    const qs = serializeSpotSearchParams(merged);
    return qs ? `/spots?${qs}` : '/spots';
  };

  const chips: { key: string; label: string; href: string }[] = [];

  if (current.q) {
    chips.push({
      key: 'q',
      label: `「${current.q}」`,
      href: hrefWithout({ q: undefined }),
    });
  }

  if (current.region) {
    chips.push({
      key: 'region',
      label: current.region,
      href: hrefWithout({ region: undefined }),
    });
  }

  if (current.prefecture) {
    const pref = prefectureGroups
      .flatMap((g) => g.prefectures)
      .find((p) => p.id === current.prefecture);
    if (pref) {
      chips.push({
        key: 'prefecture',
        label: pref.name,
        href: hrefWithout({ prefecture: undefined }),
      });
    }
  }

  if (current.month) {
    chips.push({
      key: 'month',
      label: COPY.common.months.ja[current.month],
      href: hrefWithout({ month: undefined }),
    });
  }

  if (current.flower) {
    chips.push({
      key: 'flower',
      label: current.flower,
      href: hrefWithout({ flower: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {COPY.spotsList.activeFilters.heading}
      </span>
      {chips.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          aria-label={COPY.spotsList.activeFilters.removeAria(c.label)}
          className="inline-flex items-center gap-1.5 rounded-pill border border-brand bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
        >
          <span>{c.label}</span>
          <X className="size-3.5" aria-hidden />
        </Link>
      ))}
      <Link href="/spots" className="ml-1 text-xs font-medium text-ink-muted hover:text-ink">
        {COPY.spotsList.activeFilters.clearAll}
      </Link>
    </div>
  );
}
