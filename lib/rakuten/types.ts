/**
 * 楽天ウェブサービスのレスポンス型。
 *
 * 公式ドキュメント:
 *   - 楽天ブックス検索:   https://webservice.rakuten.co.jp/documentation/books-total-search
 *   - 楽天市場商品検索:   https://webservice.rakuten.co.jp/documentation/ichiba-item-search
 *   - 楽天トラベル空室:   https://webservice.rakuten.co.jp/documentation/vacant-hotel-search
 *
 * レスポンスは項目数が多いため、UI で使う最小限のフィールドのみ拾う。
 */

// ===== 楽天ブックス検索 =====

export type RakutenBookItem = {
  title: string;
  author: string;
  publisherName: string;
  itemUrl: string;
  affiliateUrl: string;
  /** 200 × 200 程度のサムネイル。`thumbnail.image.rakuten.co.jp` ドメイン */
  largeImageUrl: string;
  /** 通常は税込価格（円） */
  itemPrice: number;
};

type BooksApiResponseItem = { Item: RakutenBookItem };

export type BooksSearchApiResponse = {
  Items?: BooksApiResponseItem[];
};

// ===== 楽天市場商品検索 =====

export type RakutenProductItem = {
  itemName: string;
  shopName: string;
  itemUrl: string;
  affiliateUrl: string;
  /** medium または small。`mediumImageUrls[0].imageUrl` を取り出す */
  mediumImageUrls: { imageUrl: string }[];
  itemPrice: number;
};

type ProductApiResponseItem = { Item: RakutenProductItem };

export type ProductSearchApiResponse = {
  Items?: ProductApiResponseItem[];
};

// ===== 楽天トラベル空室検索 =====

export type RakutenHotelItem = {
  hotelNo: number;
  hotelName: string;
  hotelInformationUrl: string;
  /** アフィリエイト ID が付与された URL（responseType=small でも返る） */
  hotelAffiliateUrl: string;
  /** km 単位。緯度経度指定検索時のみ */
  reviewAverage?: number;
  reviewCount?: number;
  hotelMinCharge?: number;
  /** medium または small。地域・施設によって有無あり */
  hotelImageUrl?: string;
  hotelThumbnailUrl?: string;
  address1?: string;
  address2?: string;
  access?: string;
};

type HotelBasicInfo = { hotelBasicInfo: RakutenHotelItem };
type HotelApiResponseItem = { hotel: HotelBasicInfo[] };

export type HotelSearchApiResponse = {
  hotels?: HotelApiResponseItem[];
};
