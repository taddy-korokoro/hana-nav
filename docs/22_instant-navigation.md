# 22. Instant Navigation 全画面対応

## 概要

公開画面の主要ルートに Next.js の **`unstable_instant`** を適用し、`<Link>` のプリフェッチ + 静的シェル生成によるクライアント遷移高速化を効かせる。CLAUDE.md「クライアントサイドナビゲーションが遅い場合、`Suspense` だけでは不十分」のヒントに沿った仕上げ作業。

## 依存チケット

- [05](./05_top-page.md) / [06](./06_spot-search.md) / [07](./07_spot-detail.md) / [08](./08_flower-pages.md) / [09](./09_area-pages.md) — 公開ページ実装が一通り終わってから手を入れる
- [13](./13_mypage.md) / [14](./14_review.md) — マイページ系も対応するなら同じく完了後

## 関連ファイル

- `next.config.ts`（`cacheComponents` 有効化）
- 各ルートの `page.tsx`（`unstable_instant` エクスポート / `dynamic = 'force-dynamic'` 削除）
- 各 Server Component（`use cache` ディレクティブ追加 or `<Suspense>` 境界の追加）
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md` — 一次資料
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md` — API 仕様

## 前提・制約

`unstable_instant` は **`cacheComponents` を有効化しないと動かない**。さらに `cacheComponents` 有効下では「Server Component が cookies / headers / DB を直接 read する場合は Suspense で囲むか、データ層を `use cache` でキャッシュする」必要があり、現状の各 page.tsx の `dynamic = 'force-dynamic'` は撤去する設計変更を伴う。

つまりこのチケットは **キャッシュ戦略の見直しを兼ねる** ため、影響範囲が広い。08 などのチケットに混ぜると「機能実装 + キャッシュ再設計」が同じ PR に乗ってレビューしづらいので独立チケットとして切る。

## TODO

### 設計確認

- [ ] `cacheComponents` 有効化に伴って影響を受けるページを棚卸し（`grep -r "force-dynamic" app/`）
- [ ] 各ページについて「`use cache` できる範囲」と「Suspense で囲むべき動的領域」を区分
  - 公開ページ：花マスター・スポットマスターは `use cache` + `revalidateTag` で扱える
  - マイページ：cookies / Auth セッションが絡むので各 Server Component を Suspense でラップ
  - 管理画面：基本は static shell に向かないので対象外（`unstable_instant = false` を明示）

### 実装

- [ ] `next.config.ts` に `experimental.cacheComponents = true` を追加
- [ ] 各 Server Component のデータ取得を `use cache` に切り替え（`lib/queries/*` 経由のもの）
- [ ] cookies / auth が絡む箇所は `<Suspense>` で囲む
- [ ] 対象ルート（トップ / `/spots` / `/spots/[id]` / `/flowers` / `/flowers/[id]` / `/areas/[prefecture_id]`）に `export const unstable_instant = { prefetch: 'static' }` を追加
- [ ] 既存の `export const dynamic = 'force-dynamic'` を削除（`unstable_instant` と矛盾するため）
- [ ] 管理画面・マイページ詳細など適用しないルートには `export const unstable_instant = false` を明示（バリデーションをスキップ）

### 検証

- [ ] `next.config.js` の `experimental.instantNavigationDevToolsToggle = true` を一時的に有効化し、Next.js DevTools の「Instant Navs」で挙動を目視確認
- [ ] `npm run build` でビルド時バリデーションが通ることを確認（エラー = 静的シェル化できない箇所）
- [ ] `<Link>` プリフェッチ後の遷移が体感で即時になることを確認（一覧 ↔ 詳細の往復）

## 注意点

- `unstable_instant` は名前のとおり **unstable**。Next.js の最新版で API が変わる可能性があるので、適用後しばらくはアップグレード時に追従コストが発生する想定で扱う
- `cacheComponents` 有効化はキャッシュ動作が変わるので、データの「鮮度」と「キャッシュ TTL」をチケット 19 (SEO) や `/api/*` の Cache-Control ヘッダ設計と合わせて再確認する
- `use cache` はサーバ起動中の in-memory キャッシュなのでデプロイ間で揺らぐ。永続化が必要なら `revalidateTag` でキー設計する

## 完了基準

- [ ] 公開ページのうち主要ルートが `unstable_instant` 対応で `npm run build` が通る
- [ ] 一覧 ↔ 詳細の遷移がプリフェッチ済み URL で即座に切り替わる
- [ ] マイページ・管理画面など対象外ルートが意図的に `unstable_instant = false` で除外されている

## 参考

- [CLAUDE.md](../CLAUDE.md) 冒頭「重要：Next.jsバージョンについて」のヒント
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`
