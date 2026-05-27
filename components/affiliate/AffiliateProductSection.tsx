import { AffiliateProductCard } from '@/components/affiliate/AffiliateProductCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { AffiliateSectionSkeleton } from '@/components/affiliate/AffiliateSectionSkeleton';
import { COPY } from '@/lib/constants/copy';
import { searchProductsByFlowerName } from '@/lib/queries/rakuten';

/**
 * Product セクション用 Suspense fallback。flowerName 不明の段階で描く必要があるため
 * fallback URL は汎用「花」キーワードに置く（実 Section レンダリング時に正しい URL に差し変わる）。
 */
export function AffiliateProductSectionSkeleton() {
  return (
    <AffiliateSectionSkeleton
      eyebrow={COPY.affiliate.products.eyebrow}
      title={COPY.affiliate.products.title}
      description={COPY.affiliate.products.description}
      fallbackUrl={COPY.affiliate.products.fallbackUrl('花')}
      empty={COPY.affiliate.products.empty}
      variant="product"
    />
  );
}

/**
 * 花の種類詳細ページに挿入する商品カード群（種・苗・球根など）。
 */
export async function AffiliateProductSection({ flowerName }: { flowerName: string }) {
  const trimmed = flowerName.trim();
  const products = trimmed ? await searchProductsByFlowerName(trimmed) : [];

  return (
    <AffiliateSectionLayout
      eyebrow={COPY.affiliate.products.eyebrow}
      title={COPY.affiliate.products.title}
      description={COPY.affiliate.products.description}
      fallbackUrl={COPY.affiliate.products.fallbackUrl(trimmed || '花')}
      empty={COPY.affiliate.products.empty}
      isEmpty={products.length === 0}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <AffiliateProductCard key={product.id} product={product} />
        ))}
      </div>
    </AffiliateSectionLayout>
  );
}
