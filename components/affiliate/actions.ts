'use server';

/**
 * AI 判定結果ページから呼ばれる Server Action。
 *
 * 判定結果は sessionStorage（クライアント側）にあるため、花名は Server Component
 * の prop として渡せない。Client Component から Server Action 経由で楽天 API を叩く。
 *
 * `searchBooksByFlowerName` 自体は React.cache + fetch revalidate で重複呼び出しを抑制
 * するので、ここでは単に薄いラッパに留める。
 */

import { searchBooksByFlowerName, type AffiliateBook } from '@/lib/queries/rakuten';

export async function getAffiliateBooksAction(flowerName: string): Promise<AffiliateBook[]> {
  return searchBooksByFlowerName(flowerName);
}
