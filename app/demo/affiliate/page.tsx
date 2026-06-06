import { AffiliateHotelCard } from '@/components/affiliate/AffiliateHotelCard';
import { AffiliateLink } from '@/components/affiliate/AffiliateLink';
import { AffiliateProductCard } from '@/components/affiliate/AffiliateProductCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { COPY } from '@/lib/constants/copy';
import type { AffiliateHotel, AffiliateProduct } from '@/lib/queries/rakuten';
import { DemoNav } from '../_components/demo-nav';
import { SiteFooter } from '../_components/site-footer';
import { SiteHeader } from '../_components/site-header';

export const metadata = {
  title: 'アフィリエイト — Hana Nav Demo',
};

// 楽天 API キーが無い環境でも UI を確認できるよう、ハードコードしたサンプルでショーケースする。
// 本番の API レスポンス形は lib/rakuten/types.ts と lib/queries/rakuten.ts を参照。
const SAMPLE_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'p-1',
    title: 'ネモフィラ 種 100粒入り 国産',
    shopName: '花の種専門店',
    imageUrl: '',
    affiliateUrl: 'https://search.rakuten.co.jp/',
    price: 480,
  },
  {
    id: 'p-2',
    title: 'チューリップ 球根 ミックス 30球',
    shopName: 'ガーデニングストア',
    imageUrl: '',
    affiliateUrl: 'https://search.rakuten.co.jp/',
    price: 1280,
  },
  {
    id: 'p-3',
    title: 'バラ 苗 ピンク アーチ仕立て',
    shopName: 'ローズガーデン',
    imageUrl: '',
    affiliateUrl: 'https://search.rakuten.co.jp/',
    price: 3980,
  },
];

const SAMPLE_HOTELS: AffiliateHotel[] = [
  {
    id: 'h-1',
    name: 'ホテルテンプレート水戸',
    imageUrl: null,
    affiliateUrl: 'https://travel.rakuten.co.jp/',
    minCharge: 6800,
    reviewAverage: 4.12,
    reviewCount: 312,
    address: '茨城県水戸市〇〇',
    access: 'JR 水戸駅から徒歩 5 分',
  },
  {
    id: 'h-2',
    name: 'リゾートひたちなか',
    imageUrl: null,
    affiliateUrl: 'https://travel.rakuten.co.jp/',
    minCharge: 12500,
    reviewAverage: 4.51,
    reviewCount: 89,
    address: '茨城県ひたちなか市〇〇',
    access: 'ひたち海浜公園から車で 10 分',
  },
  {
    id: 'h-3',
    name: 'ビジネスイン勝田',
    imageUrl: null,
    affiliateUrl: 'https://travel.rakuten.co.jp/',
    minCharge: null,
    reviewAverage: null,
    reviewCount: null,
    address: '茨城県ひたちなか市〇〇',
    access: '勝田駅徒歩 3 分',
  },
];

export default function AffiliateDemoPage() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteHeader />
      <DemoNav current="/demo/affiliate" />
      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-24 pt-12">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
            22a · Affiliate
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            アフィリエイトコンポーネント
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-ink-muted">
            楽天アフィリエイト（ブックス / 市場 / トラベル）の 3
            セクション。「広告」バッジ・空状態フォールバック・包括的な ※注意書きの 3
            要素が景品表示法対応のキモ。
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            AffiliateLink バリエーション
          </h2>
          <p className="text-sm text-ink-muted">
            badgeVariant: overlay（カード）/ inline（テキスト）/
            hidden（バッジは親側で表示する場合）
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <AffiliateLink
              href="https://example.com/"
              badgeVariant="overlay"
              className="aspect-[3/4] rounded-card border border-line bg-surface-2"
              ariaLabel="overlay variant sample"
            >
              <div className="grid h-full place-content-center text-xs text-ink-muted">
                overlay バッジ
              </div>
            </AffiliateLink>
            <div className="rounded-card border border-line bg-white p-4 text-sm">
              <AffiliateLink href="https://example.com/" badgeVariant="inline" showExternalIcon>
                <span className="text-brand underline-offset-4 group-hover:underline">
                  楽天で詳しく見る
                </span>
              </AffiliateLink>
            </div>
            <div className="rounded-card border border-line bg-white p-4 text-sm">
              <AffiliateLink href="https://example.com/" badgeVariant="hidden" className="inline">
                <span className="text-brand underline-offset-4 group-hover:underline">
                  バッジ非表示（親側で出す）
                </span>
              </AffiliateLink>
            </div>
          </div>
        </section>

        <AffiliateSectionLayout
          eyebrow={COPY.affiliate.products.eyebrow}
          title={COPY.affiliate.products.title}
          description={COPY.affiliate.products.description}
          fallbackUrl={COPY.affiliate.products.fallbackUrl('チューリップ')}
          empty={COPY.affiliate.products.empty}
          isEmpty={false}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {SAMPLE_PRODUCTS.map((product) => (
              <AffiliateProductCard key={product.id} product={product} />
            ))}
          </div>
        </AffiliateSectionLayout>

        <AffiliateSectionLayout
          eyebrow={COPY.affiliate.hotels.eyebrow}
          title={COPY.affiliate.hotels.title}
          description={COPY.affiliate.hotels.description}
          fallbackUrl={COPY.affiliate.hotels.fallbackUrl}
          empty={COPY.affiliate.hotels.empty}
          isEmpty={false}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_HOTELS.map((hotel) => (
              <AffiliateHotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </AffiliateSectionLayout>

        <AffiliateSectionLayout
          eyebrow={COPY.affiliate.products.eyebrow}
          title="空状態のフォールバック"
          description="API 障害時 / 該当なし時はカード群の代わりに楽天検索リンクを出す。"
          fallbackUrl={COPY.affiliate.products.fallbackUrl('珍しい花')}
          empty={COPY.affiliate.products.empty}
          isEmpty
        >
          {null}
        </AffiliateSectionLayout>
      </main>
      <SiteFooter />
    </div>
  );
}
