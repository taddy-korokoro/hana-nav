import { StarIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';

type Size = 'sm' | 'md';

type Props = {
  /** 0〜5 の評価値。小数（例: 3.5）も受け付ける。範囲外はクランプする。 */
  rating: number;
  size?: Size;
};

/**
 * 平均評価 / 個別レビュー双方で使う星表示。整数値だけでなく 3.5 のような小数も
 * 「灰星の上に幅クリップした塗り星を重ねる」方式で正確に表現する。
 *
 * gap を含む全幅に対する割合で前景幅を決めるため、半端な小数は厳密に「半分」とは
 * ずれる可能性があるが、視覚的に「整数の間」が伝われば十分（仕様: 0.1 刻みの平均）。
 */
export function StarRating({ rating, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'size-3.5' : 'size-5';
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <div
      className="relative inline-flex items-center"
      aria-label={COPY.spotDetail.reviews.ratingAria(rating)}
      role="img"
    >
      <div className="flex items-center gap-0.5 text-line-strong">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className={sizeClass} aria-hidden />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-0.5 overflow-hidden text-brand"
        style={{ width: `${percent}%` }}
        aria-hidden
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className={`${sizeClass} shrink-0`} aria-hidden />
        ))}
      </div>
    </div>
  );
}
