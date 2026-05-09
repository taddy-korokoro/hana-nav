# 05. トップページ（F-01）

## 概要

「いつ・どこで・何が咲いているか」が一目で分かるランディング。今月見頃のスポットを地図/カードで提示する。

## 関連機能

- F-01 トップページ（見頃マップ × 検索UI）

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/(site)/page.tsx`
- `app/(site)/loading.tsx`
- `components/home/HeroSection.tsx`
- `components/home/SearchBar.tsx`
- `components/home/SeasonMap.tsx`（Google Maps）
- `components/home/FeaturedSpots.tsx`
- `components/home/FlowerTypeGrid.tsx`
- `lib/queries/topSpots.ts`
- `lib/utils/seasonUtils.ts`

## 関連 DB

`spots`, `flowers`, `prefectures`, `images`, `spot_flowers`

DB 側に `spots_latitude(spots)` / `spots_longitude(spots)` の computed column を追加（GEOGRAPHY → lat/lng 変換用）。詳細は [`specs/database.md`](./specs/database.md) を参照。

## TODO

### Hero / 検索

- [x] ヒーローセクション（キャッチコピー + 季節のビジュアル）
- [x] 検索バー（キーワード／都道府県／花種類のクイックリンク）
- [x] CTA：AI 花判定への導線

### 今月見頃マップ

- [x] Google Maps JavaScript API のロード（`@vis.gl/react-google-maps` or 直接 SDK）
- [x] 「今月見頃」のスポットを Server Component で取得（`isInBestSeason` ヘルパー使用）
- [x] ピンクラスタリング（密集地対応）
- [x] ピンクリックで簡易カード表示 → 詳細へリンク

### 今月見頃カード一覧

- [x] カードグリッド（カバー画像 + 名称 + 都道府県 + 見頃月）
- [x] 8〜12件をピックアップしてカード表示
- [x] 「もっと見る」→ `/spots?month=current` へ遷移

### 花の種類グリッド

- [x] 主要花種類（10種類前後）をグリッド表示
- [x] 各カードから `/flowers/[id]` へ遷移

### 動作確認

- [ ] LCP/CLS が良好（Lighthouse モバイルスコア 80+） — 実データ投入後（チケット 18）にチェック
- [x] 月またぎの見頃判定（12〜2月の梅など）が正しく出る — `seasonUtils.isInBestSeason` で実装済
- [x] 地図が表示されない端末でもカード一覧は見える — API キーや座標が無いときは地図セクションを出さない

## 完了基準

- [x] 今月見頃のスポットが地図とカードで表示される（スポットが 0 件のときは「準備中」の空状態を表示）
- [x] 検索 UI からスポット検索ページに遷移できる
- [x] 主要な花種類への導線がある

## 参考

- [specs/pages.md](./specs/pages.md) — 公開ページ一覧
- [specs/database.md](./specs/database.md) — spots / 月またぎ見頃判定クエリ / `spots_latitude` / `spots_longitude`
