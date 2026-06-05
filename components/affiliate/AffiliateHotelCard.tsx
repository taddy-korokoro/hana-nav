import Image from 'next/image';
import { AffiliateLink } from '@/components/affiliate/AffiliateLink';
import { MapPinIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { AffiliateHotel } from '@/lib/queries/rakuten';

export function AffiliateHotelCard({ hotel }: { hotel: AffiliateHotel }) {
  return (
    <AffiliateLink
      href={hotel.affiliateUrl}
      ariaLabel={hotel.name}
      className="rounded-card border border-line bg-white p-3 transition hover:border-line-strong"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-surface-2">
        {hotel.imageUrl ? (
          <Image
            src={hotel.imageUrl}
            alt={hotel.name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div
            className="size-full bg-gradient-to-br from-sky-200 via-blue-100 to-cyan-100"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-ink">
          {hotel.name}
        </p>
        {hotel.address && (
          <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
            <MapPinIcon className="size-3.5 shrink-0" />
            {hotel.address}
          </p>
        )}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1 text-xs">
          {hotel.reviewAverage != null && hotel.reviewCount != null && hotel.reviewCount > 0 && (
            <span className="text-ink-muted">
              {COPY.affiliate.hotels.reviewSummary(hotel.reviewAverage, hotel.reviewCount)}
            </span>
          )}
          {hotel.minCharge != null && hotel.minCharge > 0 && (
            <span className="text-sm font-bold text-brand">
              {COPY.affiliate.hotels.minChargeLabel(hotel.minCharge)}
            </span>
          )}
        </div>
      </div>
    </AffiliateLink>
  );
}
