'use client';

import Link from 'next/link';
import { useState } from 'react';
import { COPY } from '@/lib/constants/copy';
import type { PrefectureGroup } from '@/lib/queries/spotSearch';

/**
 * トップの「エリアから探す」ピッカー。
 * 地方タブで切り替え → その地方の都道府県を pill リストで表示。
 * 47 都道府県全件を Server Component で渡しておき、タブ切替はクライアント側のフィルタだけで完結する。
 */
export function AreaPicker({ groups }: { groups: PrefectureGroup[] }) {
  const [selectedRegion, setSelectedRegion] = useState(groups[0]?.region ?? '');
  const current = groups.find((g) => g.region === selectedRegion) ?? groups[0];

  if (!current) return null;

  return (
    <div className="mt-6 rounded-card border border-line bg-white p-4 md:p-6">
      <div
        role="tablist"
        aria-label={COPY.home.areaPicker.tabsAria}
        className="-mx-1 flex flex-wrap gap-1"
      >
        {groups.map((g) => {
          const active = g.region === current.region;
          return (
            <button
              key={g.region}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedRegion(g.region)}
              className={
                active
                  ? 'rounded-pill bg-brand px-4 py-1.5 text-sm font-semibold text-white transition'
                  : 'rounded-pill px-4 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-surface-2 hover:text-ink'
              }
            >
              {g.region}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {current.prefectures.map((p) => (
          <li key={p.id}>
            <Link
              href={`/areas/${p.id}`}
              className="inline-flex rounded-pill border border-line bg-white px-3 py-1.5 text-sm text-ink transition hover:border-line-strong hover:bg-surface"
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
