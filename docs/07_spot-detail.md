# 07. スポット詳細（F-03）

## 概要

スポット個別ページ。地図ピン、画像スライダー、見られる花、レビュー、関連スポットを表示する。SNS シェア用 OGP も整える。

## 関連機能

- F-03 スポット詳細

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/spots/[id]/page.tsx`
- `app/spots/[id]/loading.tsx`
- `app/spots/[id]/not-found.tsx`
- `app/api/spots/[id]/route.ts`
- `components/spots/SpotImageGallery.tsx`
- `components/spots/SpotMapPin.tsx`
- `components/spots/SpotFlowersList.tsx`
- `components/spots/SpotReviewSection.tsx`
- `components/spots/RelatedSpots.tsx`

## 関連 DB

`spots`, `images`, `spot_flowers`, `flowers`, `reviews`, `profiles`, `prefectures`

## TODO

### ページ本体

- [ ] `/spots/[id]/page.tsx` Server Component
- [ ] `params: Promise<{ id: string }>` を `await` して取得
- [ ] スポット未存在/未公開時は `notFound()` を呼ぶ
- [ ] `generateMetadata` で動的タイトル・description・OGP

### データ取得

- [ ] `spots` 本体（prefecture を join）
- [ ] `images`（owner_type='spot', owner_id=spot.id, display_order 昇順）
- [ ] `spot_flowers` + `flowers`（中間テーブル経由）
- [ ] `reviews` + `profiles`（退会済表示考慮）
- [ ] 関連スポット（同じ都道府県 or 同じ花種類）を最大4件
- [ ] これらは `Promise.all` で並列化

### 表示

- [ ] カバー画像 + サムネイルスライダー
- [ ] スポット名（ふりがな付き）/ 住所 / アクセス / 駐車場 / 入場料
- [ ] 見頃カレンダー（best_season + spot_flowers.bloom_*_month）
- [ ] 見られる花一覧（カードリンク → `/flowers/[id]`）
- [ ] Google Maps ピン表示（公式駐車場/入口前提）
- [ ] 「経路を調べる」ボタン（Google Maps URL）
- [ ] 公式サイトリンク（`official_url`）
- [ ] 出典クレジット（`source`）
- [ ] マナー啓発文言（ゴミを持ち帰ろう／花は摘まない）
- [ ] レビュー表示（評価平均 + 一覧）
- [ ] ブックマーク追加ボタン（[10](./10_bookmark.md) 連携）
- [ ] 関連スポット

### SEO

- [ ] JSON-LD（TouristAttraction）を埋め込む
- [ ] 画像の `alt` に `images.caption` を反映

### 動作確認

- [ ] 月またぎ見頃の表示が正しい
- [ ] 見られる花が複数ある場合のレイアウト
- [ ] レビュー 0 件のときの空状態
- [ ] 退会済ユーザーのレビューが「退会済ユーザー」と表示

## 完了基準

- [ ] スポット詳細が一通り表示される
- [ ] 画像スライダー・地図ピン・関連花への動線が動く
- [ ] OGP / JSON-LD が出力される

## 参考

- CLAUDE.md「8.3 spots / images / spot_flowers / reviews」
- CLAUDE.md「12.5 構造化データ（JSON-LD）」
- CLAUDE.md「13. オーバーツーリズム対策」
