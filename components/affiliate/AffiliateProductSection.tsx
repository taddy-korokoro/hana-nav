import { AffiliateProductCard } from '@/components/affiliate/AffiliateProductCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { COPY } from '@/lib/constants/copy';
import { searchProductsByFlowerName } from '@/lib/queries/rakuten';

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
