import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';

/**
 * Section の Suspense fallback として描画するスケルトン。
 *
 * 本物の Section と同じシェル（AffiliateSectionLayout）を描いた上に、Card と同じ
 * アスペクト比のプレースホルダーを並べることで、ストリーミング挿入時の CLS
 * （レイアウトシフト）を抑える。
 *
 * variant ごとに Card のアスペクト比だけが変わる：
 *   - book: 3/4（縦長書影）
 *   - product: 1/1（正方形商品画像）
 *   - hotel: 4/3（横長ホテル外観）
 */
type Variant = 'book' | 'product' | 'hotel';

const VARIANT_CONFIG: Record<Variant, { aspect: string; gridClass: string; count: number }> = {
  book: {
    aspect: 'aspect-[3/4]',
    gridClass: 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
    count: 4,
  },
  product: {
    aspect: 'aspect-square',
    gridClass: 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
    count: 4,
  },
  hotel: {
    aspect: 'aspect-[4/3]',
    gridClass: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
    count: 3,
  },
};

export function AffiliateSectionSkeleton({
  eyebrow,
  title,
  description,
  fallbackUrl,
  empty,
  variant,
}: {
  eyebrow: string;
  title: string;
  description: string;
  fallbackUrl: string;
  empty: string;
  variant: Variant;
}) {
  const { aspect, gridClass, count } = VARIANT_CONFIG[variant];

  return (
    <AffiliateSectionLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      fallbackUrl={fallbackUrl}
      empty={empty}
      isEmpty={false}
    >
      <div className={gridClass}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-white p-3" aria-hidden>
            <div className={`${aspect} w-full animate-pulse rounded-md bg-surface-2`} />
            <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </AffiliateSectionLayout>
  );
}
