import { COPY } from '@/lib/constants/copy';
import { isInBestSeason } from '@/lib/utils/seasonUtils';

type Props = {
  start: number | null;
  end: number | null;
};

/**
 * 12 か月の見頃カレンダー帯。`start` / `end` の月は brand のフィル、
 * それ以外は薄いグレー。`start > end` の月またぎ（例: 椿 12〜3 月）にも対応する。
 * どちらか NULL の場合は「準備中」表示にフォールバック。
 */
export function FlowerSeasonChart({ start, end }: Props) {
  if (start == null || end == null) {
    return (
      <p className="rounded-card border border-line bg-white p-4 text-sm text-ink-muted">
        {COPY.flowerDetail.seasonUnknown}
      </p>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-12 gap-1">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const peak = isInBestSeason(start, end, month);
          const monthLabel = COPY.common.months.ja[month];
          return (
            <li key={month} className="flex flex-col items-center gap-1">
              <span
                aria-label={COPY.flowerDetail.seasonChart.monthAria(monthLabel, peak)}
                className={`h-8 w-full rounded-card transition ${
                  peak ? 'bg-brand' : 'bg-surface-2'
                }`}
              />
              <span className="text-[10px] text-ink-faint">{month}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-faint">{COPY.flowerDetail.seasonChart.caption}</p>
    </div>
  );
}
