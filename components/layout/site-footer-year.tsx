'use client';

import { COPY } from '@/lib/constants/copy';
import { tokyoYmd } from '@/lib/utils/dateUtils';

/**
 * フッターの著作権年表示。
 *
 * チケット 22 Step 1: cacheComponents 有効化後は Server Component から
 * `new Date()` を直接呼べない（request-time data 扱いで prerender がコケる）。
 * 著作権年は SEO 影響が小さい単発の表示なので、ハイドレーション時に決定する
 * Client Component に切り出しておく。cacheComponents off の現状でも同じ挙動。
 */
export function SiteFooterYear() {
  const year = tokyoYmd().year;
  return <>{COPY.site.copyright(year)}</>;
}
