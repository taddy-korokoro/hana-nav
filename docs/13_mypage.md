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

- [ ] Server Component、`getUser()` で認証チェック（middleware で保護済み）
- [ ] アバター + username + ロール表示
- [ ] ブックマーク件数 / レビュー件数のサマリー
- [ ] 各ページ（ブックマーク、レビュー、プロフィール編集）への導線
- [ ] 退会リンク（任意：ハードルを上げて2段階確認）

### プロフィール編集（`/mypage/profile`）

- [ ] username 編集（UNIQUE 制約に注意、フォームでバリデーション）
- [ ] アバター画像アップロード（Supabase Storage）
- [ ] Server Action で `profiles` 更新
- [ ] 更新後 `revalidatePath('/mypage', 'layout')`

### API（任意：SPA 用）

- [ ] `PATCH /api/me/profile`

### Storage 設定

- [ ] Supabase Storage に `avatars` バケット作成（public read）
- [ ] RLS：ユーザーは自分のフォルダ配下のみ書き込み可

### 退会フロー（任意 / WANT）

- [ ] `profiles.deleted_at` をセット（auth.users は残す or 削除）
- [ ] レビューは「退会済ユーザー」表示で残す方針

## 完了基準

- [ ] マイページが表示できる
- [ ] プロフィール編集が反映される
- [ ] アバター画像をアップロード・表示できる

## 参考

- CLAUDE.md「4.4 ログインユーザー専用ページ」
- CLAUDE.md「8.3 profiles」
