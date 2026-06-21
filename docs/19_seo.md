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

- [x] `metadata.title` のテンプレート（`'%s | hana nav'`）
- [x] デフォルト description / openGraph / twitter
- [x] Geo / locale: `ja_JP`
- [x] OGP デフォルト画像（1200×630px）— `app/opengraph-image.tsx` で動的生成（静的 PNG 配置は不要）

### 動的メタデータ

- [x] スポット詳細：`generateMetadata` で名称・都道府県・見頃を含むタイトル/description
- [x] 花詳細：花名 + 見頃 + 関連スポット数
- [x] エリア別：都道府県名 + 件数

### sitemap（`app/sitemap.ts`）

- [x] `/`, `/spots`, `/flowers`, `/identify` の固定パス
- [x] 公開スポット全件
- [x] 全花
- [x] 47 都道府県エリア
- [x] `lastModified` は `updated_at` 反映

### robots（`app/robots.ts`）

- [x] `/admin/`, `/api/`, `/auth/`, `/mypage/` を Disallow
- [x] sitemap URL を指定

### 検索結果ページ

- [x] `/spots?...` クエリページに `noindex` を設定（重複コンテンツ対策）

### JSON-LD

- [x] スポット詳細：`TouristAttraction`（name / description / address）
- [x] 花詳細：`Thing`（name / alternateName / description / image）
- [x] レビューがあるスポットは `aggregateRating`（reviewSummary 連携）

### 画像最適化

- [x] 全画像で `<Image>` の `alt` を `images.caption` に（カバー画像系の全クエリに `coverImageCaption` を追加し、カード/ギャラリーで `caption ?? photoAlt(name)` フォールバックで使用）
- [x] 主要ページの `priority` 指定（ギャラリー先頭、カード一覧の `index === 0` に `priority` を付与）
- [x] OGP 画像のテンプレート化（`opengraph-image.tsx` をルート / スポット / 花 / エリア別に配置）

### 動作確認（ローカル）

事前に `npm run dev` を起動。スポット ID は以下で取得して `<id>` に差し替える:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -oE "/spots/[0-9a-f-]+" | head -1
curl -s http://localhost:3000/sitemap.xml | grep -oE "/flowers/[0-9a-f-]+" | head -1
```

- [x] `/robots.txt` に `/admin/` 等の Disallow と `Sitemap:` 行
  ```bash
  curl -s http://localhost:3000/robots.txt
  ```
- [x] `/sitemap.xml` に固定 4 URL + 公開スポット + 全花 + 47 都道府県
  ```bash
  curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"   # → 4 + spots + flowers + 47
  curl -s http://localhost:3000/sitemap.xml | head -30
  ```
- [x] `/` のソースに `og:image`（`/opengraph-image`）と `summary_large_image`
  ```bash
  curl -s http://localhost:3000/ | grep -E 'og:|twitter:|<title>'
  ```
- [x] `/opengraph-image` をブラウザで開いて日本語が描画
  ```
  http://localhost:3000/opengraph-image
  ```
- [x] スポット詳細の `<head>` に動的 title / description / og:image
  ```bash
  curl -s http://localhost:3000/spots/<id> | grep -E 'og:|<title>|name="description"'
  ```
- [x] スポット詳細の JSON-LD（`TouristAttraction`）が出力、レビュー有なら `aggregateRating` 付き
  ```bash
  curl -s http://localhost:3000/spots/<id> | grep -A 30 'application/ld\+json'
  ```
- [x] `/spots/<id>/opengraph-image` で 都道府県 / スポット名 / 見頃 が描画
  ```
  http://localhost:3000/spots/<id>/opengraph-image
  ```
- [x] 花詳細の JSON-LD（`Thing`）と OGP 画像が動作
  ```bash
  curl -s http://localhost:3000/flowers/<id> | grep -A 20 'application/ld\+json'
  ```
  ```
  http://localhost:3000/flowers/<id>/opengraph-image
  ```
- [x] エリア別 `/areas/8` の title / description に件数、OGP 画像が動作
  ```bash
  curl -s http://localhost:3000/areas/8 | grep -E '<title>|name="description"'
  ```
  ```
  http://localhost:3000/areas/8/opengraph-image
  ```
- [x] `/spots?prefecture=8` のソースに `noindex` メタタグ
  ```bash
  curl -s 'http://localhost:3000/spots?prefecture=8' | grep -i 'name="robots"'
  ```
- [x] 一覧カード画像の 1 枚目に `<link rel="preload" as="image">` がついている
  ```bash
  curl -s http://localhost:3000/ | grep 'rel="preload".*as="image"'
  curl -s http://localhost:3000/spots | grep 'rel="preload".*as="image"'
  ```
- [x] DB に `caption` が登録された画像の `alt` が caption になっている
  - ブラウザで `/spots/<id>` 等を開き、DevTools コンソールで:
  ```js
  [...document.querySelectorAll('img')].map((i) => ({
    alt: i.alt,
    src: i.currentSrc.slice(0, 60),
  }));
  ```
- [x] `npm run build && npm run start` でも同様に動く（SSR 出力チェック）
  ```bash
  npm run build && npm run start
  ```

### デプロイ後（ユーザー作業）

- [ ] Google Search Console にサイトマップ送信
- [ ] Lighthouse SEO スコア 90+ を確認
- [ ] OGP デバッガー（Facebook / Twitter / Slack）で OG が正しく出る
- [ ] [Google リッチリザルトテスト](https://search.google.com/test/rich-results)で JSON-LD が `TouristAttraction` として認識される

## 完了基準

- [x] sitemap.xml / robots.txt が公開されている
- [x] 主要ページの OGP が正しく出る
- [x] スポット詳細に JSON-LD が出力されている

## 参考

- [specs/seo.md](./specs/seo.md)
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — generateMetadata / Metadata Files（sitemap.ts / robots.ts / opengraph-image.tsx）
