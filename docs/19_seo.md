# 19. SEO 実装

## 概要

検索流入の主要動線（トップ・スポット詳細・花詳細・エリア別）に対して、動的メタデータ・OGP・sitemap・robots・JSON-LD を整備する。

## 依存チケット

- [05](./05_top-page.md), [07](./07_spot-detail.md), [08](./08_flower-pages.md), [09](./09_area-pages.md)

## 関連ファイル

- `app/layout.tsx`（ルートメタデータ）
- `app/sitemap.ts`
- `app/robots.ts`
- `app/spots/[id]/page.tsx`（generateMetadata + JSON-LD）
- `app/flowers/[id]/page.tsx`（generateMetadata）
- `app/areas/[prefecture_id]/page.tsx`（generateMetadata）
- `public/og-default.png`（1200×630px）

## TODO

### ルートメタデータ

- [ ] `metadata.title` のテンプレート（`'%s | hana nav'`）
- [ ] デフォルト description / openGraph / twitter
- [ ] Geo / locale: `ja_JP`
- [ ] OGP デフォルト画像（1200×630px）を `public/og-default.png` に配置

### 動的メタデータ

- [ ] スポット詳細：`generateMetadata` で名称・都道府県・見頃を含むタイトル/description
- [ ] 花詳細：花名 + 見頃 + 関連スポット数
- [ ] エリア別：都道府県名 + 件数

### sitemap（`app/sitemap.ts`）

- [ ] `/`, `/spots`, `/flowers`, `/identify` の固定パス
- [ ] 公開スポット全件
- [ ] 全花
- [ ] 47 都道府県エリア
- [ ] `lastModified` は `updated_at` 反映

### robots（`app/robots.ts`）

- [ ] `/admin/`, `/api/`, `/auth/`, `/mypage/` を Disallow
- [ ] sitemap URL を指定

### 検索結果ページ

- [ ] `/spots?...` クエリページに `noindex` を設定（重複コンテンツ対策）

### JSON-LD

- [ ] スポット詳細：`TouristAttraction`（name / description / address）
- [ ] 花詳細：任意（`Thing` or `CreativeWork`）
- [ ] レビューがあるスポットは `aggregateRating`（時間あれば）

### 画像最適化

- [ ] 全画像で `<Image>` の `alt` を `images.caption` に
- [ ] 主要ページの `priority` 指定
- [ ] OGP 画像のテンプレート化（任意：opengraph-image.tsx で動的生成）

### 確認

- [ ] Google Search Console にサイトマップ送信
- [ ] Lighthouse SEO スコア 90+ を確認
- [ ] OGP デバッガー（Facebook / Twitter / Slack）で OG が正しく出る

## 完了基準

- [ ] sitemap.xml / robots.txt が公開されている
- [ ] 主要ページの OGP が正しく出る
- [ ] スポット詳細に JSON-LD が出力されている

## 参考

- [specs/seo.md](./specs/seo.md)
