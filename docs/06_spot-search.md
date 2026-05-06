# 06. スポット検索 + 見頃カレンダー

## 概要

スポット一覧の絞り込み検索ページ。都道府県・花種類・見頃月で絞り込める。状態は URL `searchParams` に持たせる。

## 関連機能

- F-02 スポット検索（エリア/花種類/見頃月）
- F-04 見頃カレンダー（今月/来月の絞り込み）

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/spots/page.tsx`
- `app/spots/loading.tsx`
- `app/api/spots/route.ts`
- `components/spots/SpotFilterPanel.tsx`（Client Component）
- `components/spots/SpotCard.tsx`
- `components/spots/SpotMapView.tsx`
- `components/spots/SortSelect.tsx`
- `lib/utils/seasonUtils.ts`

## 関連 DB

`spots`, `prefectures`, `flowers`, `spot_flowers`, `images`

## TODO

### Server Component（一覧本体）

- [ ] `/spots/page.tsx` を Server Component で実装
- [ ] `searchParams: Promise<{...}>` を `await` して読む（Next.js 15+ 仕様）
- [ ] パラメータ：`prefecture`, `flower`, `month`, `region`, `q`, `sort`, `page`
- [ ] Supabase クエリで絞り込み（`is_published=true AND deleted_at IS NULL` 必須）
- [ ] 月またぎ見頃判定 SQL を `seasonUtils` 経由で組み立て
- [ ] ページネーション（24件/ページ）

### フィルタ UI（Client Component）

- [ ] 都道府県セレクタ（地方区分でグループ化）
- [ ] 花種類セレクタ
- [ ] 見頃月セレクタ（今月/来月/任意月）
- [ ] フリーワード入力
- [ ] 並び順（新着順 / 名前順 / 都道府県順）
- [ ] フィルタ変更時に `router.replace` で URL 更新

### 表示

- [ ] リストビュー / マップビューの切り替え
- [ ] スポットカード（カバー画像、名称、都道府県、見頃、関連花タグ）
- [ ] 件数 0 のときの空状態
- [ ] `loading.tsx` でスケルトン表示

### API（任意）

- [ ] `GET /api/spots`（クエリで絞り込み）— SPA 的な読み込みが必要な場合

### ヘルパー

- [ ] `lib/utils/seasonUtils.ts`：`isInBestSeason(start, end, currentMonth)`
- [ ] 月またぎ判定の SQL ビルダー

### 動作確認

- [ ] 絞り込みを変えると URL とリストが同期する
- [ ] 戻るボタンで前のフィルタ状態に戻る
- [ ] SEO のため検索結果ページに `noindex` を設定（クエリパラメータ重複対策）
- [ ] モバイルでフィルタが操作しやすい（モーダル or Drawer）

## 完了基準

- [ ] 都道府県・花種類・見頃月で絞り込める
- [ ] URL を共有すると同じ結果が再現される
- [ ] マップビューで絞り込み結果がピン表示される

## 参考

- [specs/pages.md](./specs/pages.md) — 公開ページ一覧
- [specs/database.md](./specs/database.md) — spots / spot_flowers
- CLAUDE.md「Next.js App Router ベストプラクティス - URL検索パラメータを状態として活用」
