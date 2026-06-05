import { AffiliateHotelCard } from '@/components/affiliate/AffiliateHotelCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { AffiliateSectionSkeleton } from '@/components/affiliate/AffiliateSectionSkeleton';
import { COPY } from '@/lib/constants/copy';
import { searchHotelsNearSpot } from '@/lib/queries/rakuten';

/**
 * Hotel セクション用 Suspense fallback。CLS を防ぐため Card と同じアスペクト比のスケルトンを並べる。
 */
export function AffiliateHotelSectionSkeleton() {
  return (
    <AffiliateSectionSkeleton
      eyebrow={COPY.affiliate.hotels.eyebrow}
      title={COPY.affiliate.hotels.title}
      description={COPY.affiliate.hotels.description}
      fallbackUrl={COPY.affiliate.hotels.fallbackUrl}
      empty={COPY.affiliate.hotels.empty}
      variant="hotel"
    />
  );
}

/**
 * スポット詳細ページに挿入する宿カード群。
 *
 * - 緯度経度を持たないスポット（座標未登録）では何も呼ばずに楽天トラベルの汎用リンクへフォールバックする。
 * - 距離 3km 圏内、最大 5 件。
 */
export async function AffiliateHotelSection({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const hasCoordinates = latitude != null && longitude != null;
  const hotels = hasCoordinates ? await searchHotelsNearSpot({ latitude, longitude }) : [];

  return (
    <AffiliateSectionLayout
      eyebrow={COPY.affiliate.hotels.eyebrow}
      title={COPY.affiliate.hotels.title}
      description={COPY.affiliate.hotels.description}
      fallbackUrl={COPY.affiliate.hotels.fallbackUrl}
      empty={COPY.affiliate.hotels.empty}
      isEmpty={hotels.length === 0}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <AffiliateHotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </AffiliateSectionLayout>
  );
}
