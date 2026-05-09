# 09. エリア別一覧

## 概要

`/areas/[prefecture_id]` で都道府県ごとのスポット一覧を表示する。SEO 流入の入口として重要。

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md), [06](./06_spot-search.md)

## 関連ファイル

- `app/areas/[prefecture_id]/page.tsx`
- `app/areas/[prefecture_id]/not-found.tsx`
- `app/api/prefectures/route.ts`

## 関連 DB

`prefectures`, `spots`, `images`, `spot_flowers`, `flowers`

## TODO

- [x] Server Component、`params: Promise<{prefecture_id}>` を `await`
- [x] `prefecture_id` を Number に変換、不正値は `notFound()`
- [x] その都道府県のスポット一覧（`is_published=true`、`deleted_at IS NULL`）
- [x] 月別の見頃カレンダー（その県で1〜12月にどんな花が咲くか）
- [x] 地方区分のパンくず（例：関東 > 東京都）
- [x] `generateMetadata`（都道府県名 + 件数）
- [x] 関連エリア（同一地方区分の他県へのリンク）
- [ ] 地図ビュー（任意：その都道府県全体を表示）
- [ ] sitemap で 47 都道府県すべて自動生成（[19](./19_seo.md) 連携）
- [x] `generateStaticParams` で SSG 化を検討（毎週再生成）

## 完了基準

- [x] 47 都道府県すべてでページが開ける
- [x] 該当県のスポットが一覧表示される

## 参考

- [specs/pages.md](./specs/pages.md) — 公開ページ一覧
- [specs/database.md](./specs/database.md) — prefectures
