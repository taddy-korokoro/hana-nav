'use client';

import { COPY } from '@/lib/constants/copy';
import { tokyoYmd } from '@/lib/utils/dateUtils';

/**
 * フッターの著作権年表示を Client Component に切り出している理由：
 * Server Component で `new Date()` を直接呼ぶと cacheComponents 有効下では
 * request-time data 扱いで prerender に乗らない。SEO 影響が小さい著作権年
 * だけのためにフッター全体を Suspense でガードする必要はないので、葉で
 * ハイドレーション時に決定する。
 */
export function SiteFooterYear() {
  const year = tokyoYmd().year;
  return <>{COPY.site.copyright(year)}</>;
}
