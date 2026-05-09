# 06. スポット検索 + 見頃カレンダー

## 概要

スポット一覧の絞り込み検索ページ。都道府県・花種類・見頃月で絞り込める。状態は URL `searchParams` に持たせる。

## 関連機能

- F-02 スポット検索（エリア/花種類/見頃月）
- F-04 見頃カレンダー（今月/来月の絞り込み）

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/(site)/spots/page.tsx`
- `app/(site)/spots/loading.tsx`
- `components/spots/SpotCard.tsx`
- `components/spots/SpotFilterPanel.tsx`（Server Component。チップ Link 方式）
- `components/spots/SpotMapView.tsx`（Client Component）
- `components/spots/Pagination.tsx`
- `components/layout/site-header.tsx`（PC ヘッダー検索を追加）
- `lib/queries/spotSearch.ts`
- `lib/utils/seasonUtils.ts`

## 関連 DB

`spots`, `prefectures`, `flowers`, `spot_flowers`, `images`

## TODO

### Server Component（一覧本体）

- [x] `/spots/page.tsx` を Server Component で実装
- [x] `searchParams: Promise<{...}>` を `await` して読む（Next.js 15+ 仕様）
- [x] パラメータ：`prefecture`, `flower`, `month`, `region`, `q`, `sort`, `page`, `view`
- [x] Supabase クエリで絞り込み（`is_published=true AND deleted_at IS NULL` 必須）
- [x] 月またぎ見頃判定は `isInBestSeason` ヘルパーで JS フィルタ（PostgREST が列同士比較に未対応のため。MVP スケールでの妥当性は `topSpots.ts` のレビュー議論と同じ）
- [x] ページネーション（24件/ページ）

### フィルタ UI（チップ Link 方式 = Server Component）

- [x] 都道府県セレクタ（チケット 02 のマスター順）
- [x] 地方セレクタ（北海道〜九州・沖縄）
- [x] 花種類セレクタ（マスター 50 音順）
- [x] 見頃月セレクタ（1〜12 月）
- [x] フリーワード入力（`<form action="/spots" method="get">` で送信、他フィルタは hidden input で維持）
- [x] 並び順（新着順 / 名前順 / 都道府県順）
- [x] チップ Link 遷移で URL を更新（`router.replace` ではなく `<Link>` ナビゲーション。CLAUDE.md「Client 境界を末端に」「searchParams をサーバーで読む」方針に沿う）

### 表示

- [x] リストビュー / マップビューの切り替え（`?view=map`）
- [x] スポットカード（カバー画像、名称、都道府県、見頃、関連花タグ）
- [x] 件数 0 のときの空状態（フィルタクリアへの復帰アクション付き）
- [x] `loading.tsx` でスケルトン表示

### ヘッダー連携（チケット 04 から繰り越し）

- [x] PC ヘッダーに圧縮版検索フォームを配置（`/spots?q=...` へ submit）。モバイルは既存の検索アイコン（`/spots` リンク）を維持

### API（任意）

- [ ] `GET /api/spots`（クエリで絞り込み）— SPA 的な読み込みが必要になったら追加。MVP では Server Component の SSR で十分なため未実装

### ヘルパー

- [x] `lib/utils/seasonUtils.ts`（チケット 05 で実装済）
- [x] 月またぎ判定の JS フィルタ（`isInBestSeason`）— SQL ビルダーは PostgREST の列同士比較制約で見送り

### 動作確認

- [x] 絞り込みを変えると URL とリストが同期する（チップ Link 遷移で確認）
- [x] 戻るボタンで前のフィルタ状態に戻る（`<Link>` の通常ナビゲーションなので OK）
- [x] SEO のため検索結果ページに `noindex` を設定（`metadata.robots = { index: false, follow: true }`）
- [ ] モバイルでフィルタが操作しやすい — チップ群を横スクロール対応にしたが、Drawer/モーダル化は将来課題

## 完了基準

- [x] 都道府県・花種類・見頃月で絞り込める
- [x] URL を共有すると同じ結果が再現される
- [x] マップビューで絞り込み結果がピン表示される（実装済。データ 0 件のため実際のピン表示はチケット 18 投入後に再確認）

## 参考

- [specs/pages.md](./specs/pages.md) — 公開ページ一覧
- [specs/database.md](./specs/database.md) — spots / spot_flowers
- CLAUDE.md「Next.js App Router ベストプラクティス - URL検索パラメータを状態として活用」
