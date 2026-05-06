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

- [ ] 全花一覧（論理削除を除く）
- [ ] 検索（名前・エイリアス）
- [ ] 新規追加ボタン

### 花マスター詳細・編集（`/admin/flowers/[id]`）

- [ ] 名称・説明・デフォルト見頃編集
- [ ] エイリアス一覧（追加・削除）。alias は全体で UNIQUE のため衝突時エラー表示
- [ ] 画像の追加・並び替え・論理削除（`validateImageOwner` 経由）
- [ ] 関連スポット（その花が登録されているスポット）一覧

### 画像管理（`/admin/images`）

- [ ] 全画像一覧（owner_type で絞り込み）
- [ ] サムネイルグリッド表示
- [ ] 親（spot/flower）へのリンク
- [ ] 論理削除アクション
- [ ] `display_order` の一括並び替え

### Server Action / API

- [ ] `POST /api/admin/flowers`
- [ ] `PATCH /api/admin/flowers/[id]`
- [ ] エイリアス追加・削除（同一 PATCH or 別エンドポイント）
- [ ] 全エンドポイントで `requireAdmin()` 呼び出し

### 動作確認

- [ ] 新規花を作成 → AI 判定でマッチするか確認
- [ ] エイリアスの UNIQUE 衝突がハンドリングされる
- [ ] 花を論理削除すると関連 images もカスケード論理削除される

## 完了基準

- [ ] 花マスターの CRUD ができる
- [ ] エイリアス管理ができる
- [ ] 画像の登録・並び替え・論理削除ができる

## 参考

- [specs/database.md](./specs/database.md) — flowers / flower_aliases / images
- [specs/pages.md](./specs/pages.md) — 管理者専用ページ
