# 10. ブックマーク機能（F-09）

## 概要

ログインユーザーが「行きたい」スポットを保存・一覧表示・解除できる機能。論理削除運用。

## 関連機能

- F-09 ブックマーク（行きたいリスト）

## 依存チケット

- [03](./03_auth.md), [07](./07_spot-detail.md)

## 関連ファイル

- `app/api/bookmarks/route.ts`（POST）
- `app/api/bookmarks/[spot_id]/route.ts`（DELETE）
- `app/api/me/bookmarks/route.ts`（GET）
- `app/mypage/bookmarks/page.tsx`
- `components/bookmarks/BookmarkButton.tsx`（Client Component）
- `components/bookmarks/BookmarkList.tsx`

## 関連 DB

`bookmarks`, `spots`, `images`

## TODO

### API

- [x] `POST /api/bookmarks`：認証必須、`{ spot_id }` 受領、UNIQUE 衝突は再アクティブ化（`deleted_at = NULL` に戻す）
- [x] `DELETE /api/bookmarks/[spot_id]`：論理削除（`deleted_at = NOW()`）
- [x] `GET /api/me/bookmarks`：自分のブックマーク一覧（spots を join）

### UI

- [x] スポット詳細ページにブックマークボタン（ログイン時のみ表示）
- [x] 未ログイン時は `/auth/login?next=/spots/[id]` へ誘導
- [x] 楽観的更新（`useOptimistic` or `useTransition`）
- [x] `/mypage/bookmarks` 一覧ページ（カードグリッド）
- [x] 解除ボタン
- [x] 0 件時の空状態（「気になるスポットを保存しよう」）

### 動作確認

- [x] ブックマーク追加 → 一覧に出る
- [x] 解除 → 一覧から消える（DB 上は `deleted_at` がセットされる）
- [x] 同じスポットを再度ブックマークすると `deleted_at = NULL` で再アクティブ化される
- [x] 他人のブックマークは見えない（RLS）

## 完了基準

- [x] ログインユーザーが追加・削除・一覧取得できる
- [x] 論理削除で運用される

## 参考

- [specs/database.md](./specs/database.md) — bookmarks
- [specs/api.md](./specs/api.md) — ユーザー向け API
