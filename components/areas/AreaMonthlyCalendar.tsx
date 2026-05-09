import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import type { AreaMonthlyCalendar as AreaMonthlyCalendarData } from '@/lib/queries/areas';

const TOP_FLOWERS_PER_MONTH = 6;

export function AreaMonthlyCalendar({
  prefectureId,
  monthly,
}: {
  prefectureId: number;
  monthly: AreaMonthlyCalendarData[];
}) {
  const currentMonth = new Date().getMonth() + 1;
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
