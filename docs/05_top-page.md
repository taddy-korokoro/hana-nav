# 05. トップページ（F-01）

## 概要

「いつ・どこで・何が咲いているか」が一目で分かるランディング。今月見頃のスポットを地図/カードで提示する。

## 関連機能

- F-01 トップページ（見頃マップ × 検索UI）

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/page.tsx`
- `components/home/HeroSection.tsx`
- `components/home/SeasonMap.tsx`（Google Maps）
- `components/home/FeaturedSpots.tsx`
- `components/home/FlowerTypeGrid.tsx`
- `components/home/SearchBar.tsx`

## 関連 DB

`spots`, `flowers`, `prefectures`, `images`, `spot_flowers`

## TODO

### Hero / 検索

- [ ] ヒーローセクション（キャッチコピー + 季節のビジュアル）
- [ ] 検索バー（キーワード／都道府県／花種類のクイックリンク）
- [ ] CTA：AI 花判定への導線

### 今月見頃マップ

- [ ] Google Maps JavaScript API のロード（`@vis.gl/react-google-maps` or 直接 SDK）
- [ ] 「今月見頃」のスポットを Server Component で取得（`isInBestSeason` ヘルパー使用）
- [ ] ピンクラスタリング（密集地対応）
- [ ] ピンクリックで簡易カード表示 → 詳細へリンク

### 今月見頃カード一覧

- [ ] カードグリッド（カバー画像 + 名称 + 都道府県 + 見頃月）
- [ ] 8〜12件をピックアップしてカード表示
- [ ] 「もっと見る」→ `/spots?month=current` へ遷移

### 花の種類グリッド

- [ ] 主要花種類（10種類前後）をグリッド表示
- [ ] 各カードから `/flowers/[id]` へ遷移

### 動作確認

- [ ] LCP/CLS が良好（Lighthouse モバイルスコア 80+）
- [ ] 月またぎの見頃判定（12〜2月の梅など）が正しく出る
- [ ] 地図が表示されない端末でもカード一覧は見える

## 完了基準

- [ ] 今月見頃のスポットが地図とカードで表示される
- [ ] 検索 UI からスポット検索ページに遷移できる
- [ ] 主要な花種類への導線がある

## 参考

- CLAUDE.md「4.2 公開ページ一覧」
- CLAUDE.md「8.3 spots テーブル / 月またぎ見頃判定クエリ」
