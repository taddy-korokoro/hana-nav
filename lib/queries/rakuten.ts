/**
 * 楽天ウェブサービスのドメイン別クエリ関数。
 *
 * - 各関数は Server Component / Route Handler から `await` で呼ぶ前提。
 * - レスポンスは UI で使いやすい形に正規化して返す（画面は楽天 API の生形式を知らない）。
 * - 失敗時 / 該当なし時は空配列を返す。null 返却を避けて、上位の三項演算を減らす。
 *
 * キャッシュ戦略は docs/22a_rakuten-affiliate.md 参照。ここでは秒数を定数で持つ。
 */

import { cache } from 'react';
import { rakutenFetch } from '@/lib/rakuten/client';
import type {
  BooksSearchApiResponse,
  HotelSearchApiResponse,
  ProductSearchApiResponse,
} from '@/lib/rakuten/types';

// 24h / 12h / 1h（仕様書のキャッシュ戦略テーブルに準拠）
const REVALIDATE_BOOKS_SECONDS = 60 * 60 * 24;
const REVALIDATE_PRODUCTS_SECONDS = 60 * 60 * 12;
const REVALIDATE_HOTELS_SECONDS = 60 * 60;

// ===== 共通の UI 向け型 =====

export type AffiliateBook = {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  affiliateUrl: string;
  price: number;
};

export type AffiliateProduct = {
  id: string;
  title: string;
  shopName: string;
  imageUrl: string;
  affiliateUrl: string;
  price: number;
};

export type AffiliateHotel = {
  id: string;
  name: string;
  imageUrl: string | null;
  affiliateUrl: string;
  minCharge: number | null;
  reviewAverage: number | null;
  reviewCount: number | null;
  address: string;
  access: string | null;
};

// ===== 楽天ブックス検索 =====

/**
 * 花の名前で「図鑑 / 写真集」をブックス検索する。
 * 1 リクエストにつき発火するのは初回のみ（revalidate と React.cache の二重化）。
 */
export const searchBooksByFlowerName = cache(
  async (flowerName: string): Promise<AffiliateBook[]> => {
    if (!flowerName.trim()) return [];

    const res = await rakutenFetch<BooksSearchApiResponse>(
      'BooksTotalSearch/20170404',
      {
        keyword: `${flowerName} 図鑑`,
        // 書籍ジャンル（趣味・実用 > ガーデニング・フラワー）。
        // 完全一致でなくても良いため total search 側でフィルタしすぎないようにする。
        booksGenreId: '001005',
        hits: 4,
        sort: 'sales',
      },
      {
        revalidate: REVALIDATE_BOOKS_SECONDS,
        tags: [`rakuten:books:${flowerName}`],
      },
    );

    if (!res?.Items?.length) return [];

    return res.Items.map(({ Item }) => ({
      id: Item.itemUrl,
      title: Item.title,
      author: Item.author,
      imageUrl: Item.largeImageUrl,
      affiliateUrl: Item.affiliateUrl || Item.itemUrl,
      price: Item.itemPrice,
    }));
  },
);

// ===== 楽天市場商品検索 =====

/**
 * 花の名前で「種・苗・球根」を商品検索する。
 * 園芸ジャンル ID（100005: 花・ガーデン・DIY）配下に絞ることでノイズを減らす。
 *
 * keyword は花名のみ。spec の `<花名> 種 OR 苗` 表記は API が OR 検索非対応のため、
 * 過去実装の `<花名> 種 苗`（3 単語 AND）だとほぼ全て弾かれていた（タイトルに
 * 種 と 苗 を両方含む商品は稀）。genreId と sort で実質的な絞り込みを担保する。
 */
export const searchProductsByFlowerName = cache(
  async (flowerName: string): Promise<AffiliateProduct[]> => {
    if (!flowerName.trim()) return [];

    const res = await rakutenFetch<ProductSearchApiResponse>(
      'IchibaItem/Search/20220601',
      {
        keyword: flowerName,
        genreId: '100005',
        hits: 4,
        imageFlag: 1,
        sort: '-reviewCount',
      },
      {
        revalidate: REVALIDATE_PRODUCTS_SECONDS,
        tags: [`rakuten:products:${flowerName}`],
      },
    );

    if (!res?.Items?.length) return [];

    return res.Items.map(({ Item }) => ({
      id: Item.itemUrl,
      title: Item.itemName,
      shopName: Item.shopName,
      imageUrl: Item.mediumImageUrls[0]?.imageUrl ?? '',
      affiliateUrl: Item.affiliateUrl || Item.itemUrl,
      price: Item.itemPrice,
    })).filter((item) => item.imageUrl);
  },
);

// ===== 楽天トラベル空室検索 =====

/**
 * スポットの緯度経度から近隣 3km のホテルを検索する。
 * 緯度経度が無いスポットでは呼んでも結果を取れないので、上位側で先にガードする。
 */
export const searchHotelsNearSpot = cache(
  async (params: { latitude: number; longitude: number }): Promise<AffiliateHotel[]> => {
    const { latitude, longitude } = params;

    const res = await rakutenFetch<HotelSearchApiResponse>(
      'Travel/SimpleHotelSearch/20170426',
      {
        latitude,
        longitude,
        // 楽天トラベル API は degree（度）と millisec（ミリ秒）を選べる。
        // 検索半径 3km、緯度経度の datumType=1（世界測地系）が現代的な選択。
        datumType: 1,
        searchRadius: 3,
        hits: 5,
        responseType: 'small',
      },
      {
        revalidate: REVALIDATE_HOTELS_SECONDS,
        tags: [`rakuten:hotels:${latitude.toFixed(3)}:${longitude.toFixed(3)}`],
      },
    );

    if (!res?.hotels?.length) return [];

    const hotels: AffiliateHotel[] = [];
    for (const entry of res.hotels) {
      // hotel は配列で、最初の要素が hotelBasicInfo。
      // detail/small いずれも hotel[0].hotelBasicInfo に基本情報が入る。
      const basic = entry.hotel[0]?.hotelBasicInfo;
      if (!basic) continue;
      hotels.push({
        id: String(basic.hotelNo),
        name: basic.hotelName,
        imageUrl: basic.hotelImageUrl ?? basic.hotelThumbnailUrl ?? null,
        affiliateUrl: basic.hotelAffiliateUrl || basic.hotelInformationUrl,
        minCharge: basic.hotelMinCharge ?? null,
        reviewAverage: basic.reviewAverage ?? null,
        reviewCount: basic.reviewCount ?? null,
        address: [basic.address1, basic.address2].filter(Boolean).join(''),
        access: basic.access ?? null,
      });
    }
    return hotels;
  },
);
