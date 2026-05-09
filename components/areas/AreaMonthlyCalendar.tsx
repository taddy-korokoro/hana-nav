'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { COPY } from '@/lib/constants/copy';
import type { AreaMonthlyCalendar as AreaMonthlyCalendarData } from '@/lib/queries/areas';

const TOP_FLOWERS_PER_MONTH = 6;

// セッション中に月が変わるシナリオは無視するので subscribe は no-op で十分。
// useSyncExternalStore のサーバ snapshot を null にすることで SSR とハイドレーション時には
// 「ハイライトなし」を返し、クライアントマウント後に閲覧時刻ベースの月で再レンダリングされる。
const subscribe = () => () => {};
const getCurrentMonth = () => new Date().getMonth() + 1;
const getServerCurrentMonth = () => null;

export function AreaMonthlyCalendar({
  prefectureId,
  monthly,
}: {
  prefectureId: number;
  monthly: AreaMonthlyCalendarData[];
}) {
  // 親 page.tsx に `revalidate = 604800`（7 日）が設定されているため、Server 側で `new Date()` を
  // 呼ぶと ISR キャッシュ生成時の月で固定され、月またぎ後最大 7 日間「前月」が今月として
  // ハイライトされ続ける。当月判定は閲覧時刻に依存するロジックなので、useSyncExternalStore で
  // クライアント時刻に切り替える（hydration mismatch も回避できる React 18+ の作法）。
  const currentMonth = useSyncExternalStore(subscribe, getCurrentMonth, getServerCurrentMonth);

  const hasAny = monthly.some((m) => m.flowers.length > 0);

  if (!hasAny) {
    return (
      <p className="rounded-card border border-line bg-white p-6 text-sm text-ink-muted">
        {COPY.area.monthly.empty}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {monthly.map((m) => {
        const monthLabel = COPY.common.months.ja[m.month];
        const isCurrent = m.month === currentMonth;
        const visible = m.flowers.slice(0, TOP_FLOWERS_PER_MONTH);
        const overflow = m.flowers.length - visible.length;

        return (
          <li
            key={m.month}
            className={`rounded-card border bg-white p-4 ${
              isCurrent ? 'border-brand/40 bg-brand/5' : 'border-line'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p
                className={`font-serif text-lg font-bold ${isCurrent ? 'text-brand' : 'text-ink'}`}
              >
                {monthLabel}
              </p>
              {m.flowers.length > 0 && (
                <span className="text-xs text-ink-faint">
                  {COPY.area.monthly.flowerCount(m.flowers.length)}
                </span>
              )}
            </div>

            {m.flowers.length === 0 ? (
              <p className="mt-2 text-xs text-ink-faint">{COPY.area.monthly.empty}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {visible.map((f) => (
                  <li key={f.flowerId}>
                    <Link
                      href={`/spots?prefecture=${prefectureId}&flower=${encodeURIComponent(f.flowerName)}&month=${m.month}`}
                      className="inline-flex items-center gap-1 rounded-pill border border-line bg-white px-2.5 py-1 text-xs text-ink transition hover:border-line-strong"
                    >
                      <span>{f.flowerName}</span>
                      <span className="text-ink-faint">
                        {COPY.area.monthly.spotCount(f.spotCount)}
                      </span>
                    </Link>
                  </li>
                ))}
                {overflow > 0 && <li className="text-xs text-ink-faint">+{overflow}</li>}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
