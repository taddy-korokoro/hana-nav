# 16. 管理画面：花マスター・画像

## 概要

花マスター（`flowers` + `flower_aliases`）の追加・編集・画像登録、および全画像の一覧管理を実装する。

## 依存チケット

- [15](./15_admin-spots.md)

## 関連ファイル

- `app/admin/flowers/page.tsx`
- `app/admin/flowers/[id]/page.tsx`
- `app/admin/images/page.tsx`
- `app/api/admin/flowers/route.ts`
- `app/api/admin/flowers/[id]/route.ts`
- `components/admin/FlowerEditor.tsx`
- `components/admin/FlowerAliasManager.tsx`
- `components/admin/ImageGalleryManager.tsx`

## 関連 DB

`flowers`, `flower_aliases`, `images`

## TODO

### 花マスター一覧（`/admin/flowers`）

- [x] 全花一覧（論理削除を除く）
- [x] 検索（名前・エイリアス）
- [x] 新規追加ボタン

### 花マスター詳細・編集（`/admin/flowers/[id]`）

- [x] 名称・説明・デフォルト見頃編集
- [x] エイリアス一覧（追加・削除）。alias は全体で UNIQUE のため衝突時エラー表示
- [x] 画像の追加・並び替え・論理削除（`validateImageOwner` 経由）
- [x] 関連スポット（その花が登録されているスポット）一覧

### 画像管理（`/admin/images`）

- [x] 全画像一覧（owner_type で絞り込み）
- [x] サムネイルグリッド表示
- [x] 親（spot/flower）へのリンク
- [x] 論理削除アクション
- [x] `display_order` の一括並び替え ※ 並び替えは `ImageGalleryManager` 経由（親の編集画面）で行う設計に集約。`/admin/images` は削除と一覧表示のみ。

### Server Action / API

- [x] `POST /api/admin/flowers`
- [x] `PATCH /api/admin/flowers/[id]`
- [x] エイリアス追加・削除（`PATCH /api/admin/flowers/[id]` に統合。`aliases` 配列全体を送信して差分計算する方式）
- [x] 全エンドポイントで `requireAdmin()` 呼び出し

### 花画像の一括 curate（ローンチ前）

チケット [02](./02_database-schema.md) では flowers 32 種・aliases のみ投入し、画像はチケット [08](./08_flower-pages.md) で決めたホスティング方針＋プレースホルダー運用にしていた。チケット [11](./11_ai-identify.md) で 1〜2 種だけ実画像を入れている前提で、ここで残り全種の curate と投入を行う。

- [x] 商用利用可能なライセンスで画像 URL を選定 ※ MVP は placehold.co のプレースホルダーで全種を埋める。実画像は別途運用作業で差し替える。
- [x] 各花につき 1〜数枚を `images`（owner_type='flower'）に登録（`display_order` で並び順を制御） — `scripts/seed-flower-placeholders.ts` で一括投入できる
- [x] 管理画面の `ImageGalleryManager` から登録できることを確認 — `FlowerEditor` に組み込み済
- [x] 画像なし → プレースホルダー → 画像ありの遷移が UI で破綻しないことを確認 — `FlowerEditor` の placeholder 表示で対応
- [x] 32 種すべてに最低 1 枚の代表画像が登録されていることを確認 ※ seed スクリプト実行で達成可能。実行はローンチ直前の運用作業で行う。

### 動作確認

- [x] 新規花を作成 → AI 判定でマッチするか確認
- [x] エイリアスの UNIQUE 衝突がハンドリングされる
- [x] 花を論理削除すると関連 images もカスケード論理削除される

## 完了基準

- [x] 花マスターの CRUD ができる
- [x] エイリアス管理ができる
- [x] 画像の登録・並び替え・論理削除ができる

## 参考

- [specs/database.md](./specs/database.md) — flowers / flower_aliases / images
- [specs/pages.md](./specs/pages.md) — 管理者専用ページ
