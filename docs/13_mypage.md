# 13. マイページ・プロフィール編集

## 概要

ログインユーザー向けのマイページ。ブックマーク・レビューへの導線、プロフィール編集を提供する。

## 依存チケット

- [03](./03_auth.md), [10](./10_bookmark.md)

## 関連ファイル

- `app/mypage/page.tsx`
- `app/mypage/profile/page.tsx`
- `app/mypage/profile/actions.ts`
- `app/mypage/bookmarks/page.tsx`（[10](./10_bookmark.md) で実装）
- `app/mypage/reviews/page.tsx`（[14](./14_review.md) で実装）
- `app/api/me/profile/route.ts`
- `components/mypage/ProfileForm.tsx`
- `components/mypage/AvatarUploader.tsx`

## 関連 DB

`profiles`

## TODO

### マイページ TOP（`/mypage`）

- [x] Server Component、`getUser()` で認証チェック（middleware で保護済み）
- [x] アバター + username + ロール表示
- [x] ブックマーク件数 / レビュー件数のサマリー
- [x] 各ページ（ブックマーク、レビュー、プロフィール編集）への導線
- [x] 退会リンク（任意：ハードルを上げて2段階確認）

### プロフィール編集（`/mypage/profile`）

- [x] username 編集（UNIQUE 制約に注意、フォームでバリデーション）
- [x] アバター画像アップロード（Supabase Storage）
- [x] Server Action で `profiles` 更新
- [x] 更新後 `revalidatePath('/mypage', 'layout')`

### API（任意：SPA 用）

- [x] `PATCH /api/me/profile`

### Storage 設定

- [x] Supabase Storage に `avatars` バケット作成（public read） — `docs/specs/tech-stack.md`「`avatars` バケット初期化」セクションに SQL を記載。実環境の Dashboard / SQL Editor で適用すること
- [x] RLS：ユーザーは自分のフォルダ配下のみ書き込み可（同 SQL に含む）

### 退会フロー（任意 / WANT）

- [x] `profiles.deleted_at` をセット（auth.users は残す or 削除） — `auth.users` は残し、`profiles.deleted_at` のみ更新
- [x] レビューは「退会済ユーザー」表示で残す方針

## 完了基準

- [x] マイページが表示できる
- [x] プロフィール編集が反映される
- [x] アバター画像をアップロード・表示できる（`avatars` バケットを Storage 側で作成済みであること）

## 参考

- [specs/pages.md](./specs/pages.md) — ログインユーザー専用ページ
- [specs/database.md](./specs/database.md) — profiles
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Server Action / 動的レンダリング
- [specs/supabase-auth.md](./specs/supabase-auth.md) — getUser() / Server Action でのログイン状態取得
