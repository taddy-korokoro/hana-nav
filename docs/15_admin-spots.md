# 15. 管理画面：スポット管理

## 概要

管理者専用画面のうち、スポット関連（一覧・新規作成・公開待ち・詳細編集・公開フラグ切替）を実装する。`requireAdmin` 共通ユーティリティを各 API で必須化する。

## 依存チケット

- [02](./02_database-schema.md), [03](./03_auth.md)

## 関連ファイル

- `app/admin/layout.tsx`（admin レイアウト + 権限チェック）
- `app/admin/page.tsx`（ダッシュボード）
- `app/admin/spots/page.tsx`（一覧）
- `app/admin/spots/new/page.tsx`（新規作成）
- `app/admin/spots/pending/page.tsx`（公開待ち）
- `app/admin/spots/[id]/page.tsx`（詳細・編集）
- `app/api/admin/spots/route.ts`
- `app/api/admin/spots/[id]/route.ts`
- `components/admin/SpotEditor.tsx`
- `components/admin/SpotImageManager.tsx`
- `components/admin/SpotFlowerManager.tsx`
- `components/admin/CoordinatePicker.tsx`（地図クリックで緯度経度設定）
- `lib/utils/requireAdmin.ts`（[03](./03_auth.md) で実装）

## 関連 DB

`spots`, `images`, `spot_flowers`, `flowers`, `prefectures`

## TODO

### 共通

- [x] `app/admin/layout.tsx` で admin ロールチェック（middleware と二重防御）
- [x] admin 専用ナビゲーション
- [x] 全 admin API で `requireAdmin()` を呼ぶ

### ダッシュボード（`/admin`）

- [x] 公開待ちスポット数
- [x] 今月の AI 利用回数
- [x] 直近の論理削除レビュー件数
- [x] 各管理画面への導線

### スポット一覧（`/admin/spots`）

- [x] 全スポット（未公開含む、論理削除は除く）
- [x] フィルタ：公開状態 / 都道府県 / 検索
- [x] 公開フラグのトグル
- [x] 論理削除アクション

### 公開待ち（`/admin/spots/pending`）

- [x] `is_published=false AND deleted_at IS NULL` のみ
- [x] 出典・公式 URL の確認 UI（リンク + プレビュー）
- [x] 「公開する」ボタン

### スポット新規作成（`/admin/spots/new`）

- [x] フォーム：基本情報・住所・緯度経度（地図クリック）・見頃・公式 URL・出典
- [x] 画像アップロード（複数、`display_order` 自動採番）
- [x] 関連花の選択（複数、`bloom_*_month` 任意）
- [x] Server Action で `spots` + `images` + `spot_flowers` を一括 INSERT
- [x] `validateImageOwner` を経由して images を入れる

### スポット詳細・編集（`/admin/spots/[id]`）

- [x] 全カラム編集
- [x] 画像の追加・並び替え・論理削除
- [x] 関連花の追加・削除
- [x] 公開フラグの切替
- [x] 論理削除 → 子 images がカスケード論理削除されることを確認

## 完了基準

- [x] 管理者がスポットを作成・編集・公開できる
- [x] 非管理者はアクセスできない
- [x] 出典確認 → 公開のフローが回る

## 参考

- [specs/pages.md](./specs/pages.md) — 管理者専用ページ
- [specs/api.md](./specs/api.md) — 管理者向け API
- [specs/database.md](./specs/database.md) — spots / images / spot_flowers
