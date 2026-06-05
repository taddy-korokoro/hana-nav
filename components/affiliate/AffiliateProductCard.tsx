import Image from 'next/image';
import { AffiliateLink } from '@/components/affiliate/AffiliateLink';
import { COPY } from '@/lib/constants/copy';
import type { AffiliateProduct } from '@/lib/queries/rakuten';

export function AffiliateProductCard({ product }: { product: AffiliateProduct }) {
  return (
    <AffiliateLink
      href={product.affiliateUrl}
      ariaLabel={product.title}
      className="rounded-card border border-line bg-white p-3 transition hover:border-line-strong"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface-2">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition group-hover:scale-105"
            unoptimized
          />
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.title}</p>
        {product.shopName && (
          <p className="line-clamp-1 text-xs text-ink-muted">
            {COPY.affiliate.products.shopLabel(product.shopName)}
          </p>
        )}
        {product.price > 0 && (
          <p className="text-sm font-bold text-brand">
            {COPY.affiliate.products.priceLabel(product.price)}
          </p>
        )}
      </div>
    </AffiliateLink>
  );
}
