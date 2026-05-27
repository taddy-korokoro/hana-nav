/**
 * `cacheComponents` の `'use cache'` 用タグ schema。
 *
 * 公開ページ側のキャッシュ（loadFlowerBundle / loadAreaBundle / HomeContent 等）
 * は `cacheTag(...)` でこの schema のタグを付け、admin の Server Action が
 * `revalidateTag(...)` を叩くことで「マスター編集 → 公開ページ即時反映」を担保する。
 *
 * タグの単位:
 *  - `flowers`: 花マスター全件の一覧・索引に影響する変更（追加・削除・名前変更）
 *  - `flower:<id>`: 単一花の詳細・画像・別名・関連スポット
 *  - `spots`: スポットマスター全件の一覧・絞り込みに影響する変更（追加・公開・削除）
 *  - `spot:<id>`: 単一スポットの詳細・画像・関連花
 *  - `prefectures`: 都道府県マスター（基本固定だが念のため切る）
 *  - `area:<prefecture_id>`: 都道府県別ページ（spots + 月別カレンダーの集計）
 *
 * Admin Action 側は変更内容に応じて、最小限のタグを叩く（過剰 invalidation は
 * キャッシュヒット率を下げるため）。例:
 *  - flower 編集: `revalidateTag('flowers')` + `revalidateTag(\`flower:<id>\`)`
 *  - spot 公開: `revalidateTag('spots')` + `revalidateTag(\`spot:<id>\`)`
 *    + 影響する都道府県があれば `revalidateTag(\`area:<prefecture_id>\`)`
 */

export const CACHE_TAGS = {
  flowers: 'flowers',
  spots: 'spots',
  prefectures: 'prefectures',
} as const;

export function flowerTag(id: string): string {
  return `flower:${id}`;
}

export function spotTag(id: string): string {
  return `spot:${id}`;
}

export function areaTag(prefectureId: number | string): string {
  return `area:${prefectureId}`;
}
