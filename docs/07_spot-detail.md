# 07. スポット詳細（F-03）

## 概要

スポット個別ページ。地図ピン、画像スライダー、見られる花、レビュー、関連スポットを表示する。SNS シェア用 OGP も整える。

## 関連機能

- F-03 スポット詳細

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/(site)/spots/[id]/page.tsx`
- `app/(site)/spots/[id]/loading.tsx`
- `app/(site)/spots/[id]/not-found.tsx`
- `app/api/spots/[id]/route.ts`
- `components/spots/SpotImageGallery.tsx`（Client Component。サムネイル切替）
- `components/spots/SpotMapPin.tsx`（Client Component。Google Maps）
- `components/spots/SpotFlowersList.tsx`
- `components/spots/SpotReviewSection.tsx`
- `components/spots/RelatedSpots.tsx`
- `components/layout/icons.tsx`（Star / ExternalLink / Info / Navigation を追加）
- `lib/queries/spotDetail.ts`

## 関連 DB

`spots`, `images`, `spot_flowers`, `flowers`, `reviews`, `profiles`, `prefectures`

## TODO

### ページ本体

- [x] `/spots/[id]/page.tsx` Server Component
- [x] `params: Promise<{ id: string }>` を `await` して取得
- [x] スポット未存在/未公開時は `notFound()` を呼ぶ
- [x] `generateMetadata` で動的タイトル・description・OGP（軽量クエリ `getSpotMeta` を分けて二重に重い join を避けた）

### データ取得

- [x] `spots` 本体（prefecture を join、`spots_latitude` / `spots_longitude` の computed column を併用）
- [x] `images`（owner_type='spot', owner_id=spot.id, display_order 昇順）
- [x] `spot_flowers` + `flowers`（中間テーブル経由、`!inner` で論理削除済の花を除外）
- [x] `reviews` + `profiles`（退会済は profiles の RLS で自動的に null となるので、表示側で「退会済ユーザー」に振り分け）
- [x] 関連スポット（同じ都道府県を優先、足りない分は同じ花種類で補完して最大4件）
- [x] images / spot_flowers / reviews を `Promise.all` で並列化（関連スポットは `flowerIds` が必要なため後段）

### 表示

- [x] カバー画像 + サムネイルスライダー（Client Component。画像 0 件はくすみピンクのプレースホルダー）
- [x] スポット名（ふりがな付き）/ 住所 / アクセス / 駐車場 / 入場料
- [x] 見頃カレンダー（`best_season` ピル + `spot_flowers.bloom_*_month` をフォールバック付きで一覧表示）
- [x] 見られる花一覧（カードリンク → `/flowers/[id]`）
- [x] Google Maps ピン表示（`coordinates` を公式駐車場/入口に統一する運用前提。API キー / lat-lng がない場合は地図を出さず住所カードのみ）
- [x] 「経路を調べる」ボタン（lat-lng がある場合は directions、ない場合は住所検索 URL）
- [x] 公式サイトリンク（`official_url`）
- [x] 出典クレジット（`source`）
- [x] マナー啓発文言（ゴミを持ち帰ろう／花は摘まない／平日推奨）
- [x] レビュー表示（評価平均 + 一覧、退会済表示）
- [x] ブックマーク追加ボタン — チケット [10](./10_bookmark.md) で実装
- [x] 関連スポット

### SEO

- [x] JSON-LD（TouristAttraction）を埋め込む（geo / image / url を条件付きで付与）
- [x] 画像の `alt` に `images.caption` を反映（caption があればそれを、なければスポット名ベース）

### 動作確認

- [x] 月またぎ見頃の表示が正しい（`isInBestSeason` を再利用）
- [x] 見られる花が複数ある場合のレイアウト（2 カラムグリッド + 6 色のグラデーションプレースホルダー）
- [x] レビュー 0 件のときの空状態
- [x] 退会済ユーザーのレビューが「退会済ユーザー」と表示

## 完了基準

- [x] スポット詳細が一通り表示される
- [x] 画像スライダー・地図ピン・関連花への動線が動く
- [x] OGP / JSON-LD が出力される

## 参考

- [specs/database.md](./specs/database.md) — spots / images / spot_flowers / reviews
- [specs/seo.md](./specs/seo.md) — 構造化データ（JSON-LD）
- [specs/operations.md](./specs/operations.md) — オーバーツーリズム対策
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — generateMetadata / notFound() / Server Component データ取得
