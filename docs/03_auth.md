# 03. Supabase Auth 実装

## 概要

`@supabase/ssr` を使ってサーバーサイド認証を組み込む。client / server / middleware / OAuth callback / 各種認証ページを揃える。

## 関連機能

- F-08 Supabase Auth（メール+Googleログイン）

## 依存チケット

- [01](./01_project-setup.md), [02](./02_database-schema.md)

## 関連ファイル

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `middleware.ts`
- `app/auth/login/page.tsx`
- `app/auth/login/actions.ts`
- `app/auth/signup/page.tsx`
- `app/auth/signup/actions.ts`
- `app/auth/reset-password/page.tsx`
- `app/auth/update-password/page.tsx`
- `app/auth/callback/route.ts`
- `app/auth/logout/route.ts`

## TODO

### ライブラリ・設定

- [ ] `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Supabase Dashboard で Email Auth を有効化
- [ ] Supabase Dashboard で Google OAuth Provider を設定（Client ID / Secret）
- [ ] Site URL / Redirect URLs に `http://localhost:3000/auth/callback` と本番URLを登録

### Supabase クライアント

- [ ] `lib/supabase/client.ts`（`createBrowserClient`）
- [ ] `lib/supabase/server.ts`（`createServerClient` + `cookies()` の getAll/setAll）
- [ ] `lib/supabase/middleware.ts`（`updateSession` ヘルパー、保護パスのリダイレクト + admin ロールチェック）
- [ ] `middleware.ts`（`updateSession` 呼び出し + matcher 設定）

### 認証ページ

- [ ] `/auth/login`（Email + Password + Google ログインボタン）
- [ ] `/auth/login/actions.ts`（Server Action：`signInWithPassword`）
- [ ] `/auth/signup`（Email + Password + パスワード確認）
- [ ] `/auth/signup/actions.ts`（Server Action：`signUp`）
- [ ] `/auth/reset-password`（リセットメール送信）
- [ ] `/auth/update-password`（新パスワード設定）
- [ ] `/auth/callback/route.ts`（`exchangeCodeForSession`）
- [ ] `/auth/logout/route.ts`（POST、`signOut` → `/auth/login` リダイレクト）

### 共通ユーティリティ

- [ ] `lib/utils/requireAdmin.ts`（`getUser` → `profiles.role === 'admin'` チェック）
- [ ] エラー時に `redirect('/auth/login')` する `requireUser()` ヘルパー

### 動作確認

- [ ] Email でサインアップ → 確認メール → ログインできる
- [ ] Google OAuth でログインできる
- [ ] `profiles` レコードが自動作成される（`handle_new_user` トリガー）
- [ ] ログアウトできる
- [ ] パスワードリセットメールが届く
- [ ] 未ログインで `/mypage` にアクセスすると `/auth/login` にリダイレクトされる
- [ ] user ロールで `/admin` にアクセスすると `/` にリダイレクトされる
- [ ] admin ロール（手動付与）で `/admin` にアクセスできる

## DO / DON'T（再確認）

- ✅ サーバーサイドでは必ず `supabase.auth.getUser()`
- ❌ サーバーサイドで `supabase.auth.getSession()` を信用しない
- ✅ Cookie API は `getAll` / `setAll` を使う
- ❌ 旧 `get` / `set` / `remove` の3メソッド形式は使わない
- ❌ `SUPABASE_SERVICE_ROLE_KEY` を Client Component で使わない

## 完了基準

- [ ] ログイン/ログアウト/サインアップが動作する
- [ ] Middleware で `/mypage`, `/admin` が保護されている
- [ ] admin 権限チェックが効く

## 参考

- CLAUDE.md「Supabase Auth（App Router）実装ルール」
- CLAUDE.md「7. Middleware」
- <https://supabase.com/docs/guides/auth/server-side/nextjs>
