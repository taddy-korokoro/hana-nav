import Link from 'next/link';
import { ArrowRightIcon, FlowerIcon } from '@/components/layout/icons';
import type { SpotFlowerEntry } from '@/lib/queries/spotDetail';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

const FLOWER_GRADIENTS = [
  'from-pink-300 to-rose-200',
  'from-violet-300 to-purple-200',
  'from-sky-300 to-blue-200',
  'from-orange-300 to-amber-200',
  'from-rose-300 to-pink-100',
  'from-indigo-300 to-violet-200',
];

/**
 * 見られる花一覧。`bloom_*_month` がスポット固有値、フォールバックで `default_season_*`。
 * 詳細仕様は database.md「見頃情報の3層構造」を参照。
 */
export function SpotFlowersList({ flowers }: { flowers: SpotFlowerEntry[] }) {
  if (flowers.length === 0) {
    return (
      <p className="rounded-card border border-line bg-white p-6 text-sm text-ink-muted">
        この場所で見られる花はまだ登録されていません。
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {flowers.map((flower, i) => {
        const start = flower.bloomStartMonth ?? flower.defaultSeasonStart;
        const end = flower.bloomEndMonth ?? flower.defaultSeasonEnd;
        const seasonText = formatSeasonRange(start, end);
        return (
          <li key={flower.flowerId}>
            <Link
              href={`/flowers/${flower.flowerId}`}
              className="group flex items-center gap-3 rounded-card border border-line bg-white p-3 transition hover:border-line-strong"
            >
              <div
                className={`grid size-14 shrink-0 place-items-center rounded-card bg-gradient-to-br ${
                  FLOWER_GRADIENTS[i % FLOWER_GRADIENTS.length]
                } text-white/90`}
              >
                <FlowerIcon className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base font-semibold">{flower.flowerName}</p>
                {seasonText && <p className="mt-0.5 text-xs text-ink-muted">見頃 {seasonText}</p>}
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
