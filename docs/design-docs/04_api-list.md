# 04. API 一覧

| 項目       | 値                       |
| ---------- | ------------------------ |
| 参照 spec  | `docs/specs/api.md`      |
| 関連タスク | T03 画面一覧 / T05 ER 図 |

---

## 1. Route Handler 一覧（ユーザー向け）

### 1-1. 公開（認証不要）

| メソッド | URL                       | 概要                                                                                            | 実装ファイル                          |
| -------- | ------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------- |
| GET      | `/api/spots/[id]`         | スポット詳細                                                                                    | `app/api/spots/[id]/route.ts`         |
| GET      | `/api/flowers`            | 花マスター一覧                                                                                  | `app/api/flowers/route.ts`            |
| GET      | `/api/flowers/[id]`       | 花の詳細（花言葉・見頃・関連スポット）                                                          | `app/api/flowers/[id]/route.ts`       |
| GET      | `/api/prefectures`        | 都道府県マスター（地方区分でグループ化可）                                                      | `app/api/prefectures/route.ts`        |
| POST     | `/api/ai/identify-flower` | AI 花判定。画像を受け取り花情報と関連スポットを返す。レート制限あり（匿名 1/日・ログイン 3/日） | `app/api/ai/identify-flower/route.ts` |

> **Note:** スポット一覧（検索・絞り込み）は Server Component が直接 Supabase を参照するため Route Handler なし。

### 1-2. ログインユーザー向け（認証必須）

| メソッド | URL                                 | 概要                                                                         | 実装ファイル                                    |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| GET      | `/api/me/profile`                   | 自分のプロフィール取得                                                       | `app/api/me/profile/route.ts`                   |
| PATCH    | `/api/me/profile`                   | プロフィール更新（username・avatar_url）                                     | `app/api/me/profile/route.ts`                   |
| GET      | `/api/me/bookmarks`                 | 自分のブックマーク一覧                                                       | `app/api/me/bookmarks/route.ts`                 |
| GET      | `/api/bookmarks/[spot_id]`          | 特定スポットのブックマーク状態確認                                           | `app/api/bookmarks/[spot_id]/route.ts`          |
| POST     | `/api/bookmarks`                    | ブックマーク追加                                                             | `app/api/bookmarks/route.ts`                    |
| DELETE   | `/api/bookmarks/[spot_id]`          | ブックマーク削除（論理削除）                                                 | `app/api/bookmarks/[spot_id]/route.ts`          |
| POST     | `/api/reviews`                      | レビュー投稿。同一 `(user_id, spot_id)` が論理削除済みの場合は再アクティブ化 | `app/api/reviews/route.ts`                      |
| PATCH    | `/api/reviews/[id]`                 | 自分のレビュー編集（rating・comment・visited_at）                            | `app/api/reviews/[id]/route.ts`                 |
| DELETE   | `/api/reviews/[id]`                 | 自分のレビュー削除（論理削除）                                               | `app/api/reviews/[id]/route.ts`                 |
| GET      | `/api/me/reviews/by-spot/[spot_id]` | 特定スポットに対する自分のレビュー取得                                       | `app/api/me/reviews/by-spot/[spot_id]/route.ts` |

---

## 2. Route Handler 一覧（管理者向け）

全エンドポイントで `requireAdmin()`（`lib/utils/requireAdmin.ts`）により `getUser()` + `profiles.role === 'admin'` を検証する。

| メソッド | URL                         | 概要                                         | 実装ファイル                            |
| -------- | --------------------------- | -------------------------------------------- | --------------------------------------- |
| GET      | `/api/admin/spots`          | 全スポット一覧（未公開含む）・絞り込み対応   | `app/api/admin/spots/route.ts`          |
| POST     | `/api/admin/spots`          | スポット新規作成（`is_published=false`）     | `app/api/admin/spots/route.ts`          |
| GET      | `/api/admin/spots/[id]`     | スポット詳細（管理用）                       | `app/api/admin/spots/[id]/route.ts`     |
| PATCH    | `/api/admin/spots/[id]`     | スポット更新・公開フラグ変更                 | `app/api/admin/spots/[id]/route.ts`     |
| DELETE   | `/api/admin/spots/[id]`     | スポット論理削除                             | `app/api/admin/spots/[id]/route.ts`     |
| GET      | `/api/admin/flowers`        | 花マスター一覧                               | `app/api/admin/flowers/route.ts`        |
| POST     | `/api/admin/flowers`        | 花マスター新規作成                           | `app/api/admin/flowers/route.ts`        |
| GET      | `/api/admin/flowers/[id]`   | 花マスター詳細                               | `app/api/admin/flowers/[id]/route.ts`   |
| PATCH    | `/api/admin/flowers/[id]`   | 花マスター更新（別名 `flower_aliases` 含む） | `app/api/admin/flowers/[id]/route.ts`   |
| DELETE   | `/api/admin/flowers/[id]`   | 花マスター論理削除                           | `app/api/admin/flowers/[id]/route.ts`   |
| GET      | `/api/admin/users`          | ユーザー一覧・絞り込み対応                   | `app/api/admin/users/route.ts`          |
| GET      | `/api/admin/users/[id]`     | ユーザー詳細                                 | `app/api/admin/users/[id]/route.ts`     |
| PATCH    | `/api/admin/users/[id]`     | ユーザー role 変更・BAN                      | `app/api/admin/users/[id]/route.ts`     |
| GET      | `/api/admin/reviews`        | 全レビュー一覧（管理用）                     | `app/api/admin/reviews/route.ts`        |
| DELETE   | `/api/admin/reviews/[id]`   | レビュー強制論理削除                         | `app/api/admin/reviews/[id]/route.ts`   |
| POST     | `/api/admin/reviews/[id]`   | レビュー論理削除解除（復元）                 | `app/api/admin/reviews/[id]/route.ts`   |
| GET      | `/api/admin/ai-usage/stats` | AI 利用状況の日別・月別集計                  | `app/api/admin/ai-usage/stats/route.ts` |

---

## 3. Server Action 一覧

### 3-1. 認証系（`app/auth/`）

| Action 名           | ファイル                              | 概要                                    | 認証要否 |
| ------------------- | ------------------------------------- | --------------------------------------- | -------- |
| `login`             | `app/auth/login/actions.ts`           | Email + Password ログイン               | 不要     |
| `loginAsGuestAdmin` | `app/auth/login/actions.ts`           | ゲスト管理者ログイン（デモ用）          | 不要     |
| `signup`            | `app/auth/signup/actions.ts`          | 新規会員登録（Email）、メール確認フロー | 不要     |
| `logout`            | `app/auth/logout/actions.ts`          | ログアウト・Cookie クリア               | 必要     |
| `requestReset`      | `app/auth/reset-password/actions.ts`  | パスワードリセットメール送信            | 不要     |
| `updatePassword`    | `app/auth/update-password/actions.ts` | 新パスワード設定（メールリンク経由）    | 不要     |

### 3-2. ログインユーザー向け（`app/(site)/`）

| Action 名             | ファイル                               | 概要                                                           | 認証要否 |
| --------------------- | -------------------------------------- | -------------------------------------------------------------- | -------- |
| `updateUsername`      | `app/(site)/mypage/profile/actions.ts` | ユーザー名更新                                                 | 必要     |
| `setAvatarUrl`        | `app/(site)/mypage/profile/actions.ts` | アバター URL 設定（Supabase Storage 経由）                     | 必要     |
| `withdraw`            | `app/(site)/mypage/actions.ts`         | 退会（`profiles.deleted_at` 論理削除・カスケードトリガー発火） | 必要     |
| `submitContactAction` | `app/(site)/contact/actions.ts`        | お問い合わせフォーム送信・DB 保存・通知メール                  | 不要     |

### 3-3. 管理者向け（`app/admin/`）

| Action 名                   | ファイル                       | 概要                                                  | 認証要否   |
| --------------------------- | ------------------------------ | ----------------------------------------------------- | ---------- |
| `createSpotAction`          | `app/admin/spots/actions.ts`   | スポット手動作成（`is_published=false`）              | 管理者のみ |
| `updateSpotAction`          | `app/admin/spots/actions.ts`   | スポット情報更新                                      | 管理者のみ |
| `togglePublishedAction`     | `app/admin/spots/actions.ts`   | スポット公開フラグ切り替え・`updateTag('spots')` 発火 | 管理者のみ |
| `softDeleteSpotAction`      | `app/admin/spots/actions.ts`   | スポット論理削除                                      | 管理者のみ |
| `createFlowerAction`        | `app/admin/flowers/actions.ts` | 花マスター新規作成                                    | 管理者のみ |
| `updateFlowerAction`        | `app/admin/flowers/actions.ts` | 花マスター更新                                        | 管理者のみ |
| `softDeleteFlowerAction`    | `app/admin/flowers/actions.ts` | 花マスター論理削除                                    | 管理者のみ |
| `changeRoleAction`          | `app/admin/users/actions.ts`   | ユーザー role 変更（`user` ⇄ `admin`）                | 管理者のみ |
| `setBanAction`              | `app/admin/users/actions.ts`   | ユーザー BAN（`profiles.deleted_at` 論理削除）        | 管理者のみ |
| `softDeleteReviewAction`    | `app/admin/reviews/actions.ts` | レビュー強制論理削除                                  | 管理者のみ |
| `restoreReviewAction`       | `app/admin/reviews/actions.ts` | レビュー論理削除解除                                  | 管理者のみ |
| `softDeleteImageAction`     | `app/admin/images/actions.ts`  | 画像論理削除                                          | 管理者のみ |
| `updateContactStatusAction` | `app/admin/contact/actions.ts` | お問い合わせステータス更新（未対応→対応済等）         | 管理者のみ |
| `replyToContactAction`      | `app/admin/contact/actions.ts` | お問い合わせへの返信メール送信                        | 管理者のみ |

---

## 4. 認可レベルサマリ

| 認可レベル | 検証方法                                                      | 対象                                    |
| ---------- | ------------------------------------------------------------- | --------------------------------------- |
| 公開       | なし                                                          | スポット詳細・花一覧・都道府県・AI 判定 |
| 認証必須   | `supabase.auth.getUser()` でセッション確認                    | ブックマーク・レビュー・マイページ系    |
| 管理者のみ | `getUser()` + `profiles.role === 'admin'`（`requireAdmin()`） | `/api/admin/*` 全エンドポイント         |

すべての認証チェックは `supabase.auth.getUser()` を使用（`getSession()` は Cookie 改ざんが検証されないため使用しない）。

---

## 5. spec との差分

`docs/specs/api.md` からの変更・追加点：

| 種別   | 内容                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| 追加   | `GET /api/spots/[id]` — spec に記載なし（実装済み）                                                           |
| 追加   | `GET /api/me/profile` — spec は PATCH のみ記載                                                                |
| 追加   | `GET /api/bookmarks/[spot_id]` — spec に記載なし（ブックマーク状態確認用）                                    |
| 追加   | `PATCH /api/reviews/[id]`・`DELETE /api/reviews/[id]` — spec に記載なし                                       |
| 追加   | `GET /api/me/reviews/by-spot/[spot_id]` — spec に記載なし                                                     |
| 追加   | `GET /api/admin/spots/[id]`・`GET /api/admin/flowers/[id]` — spec に記載なし                                  |
| 追加   | `POST /api/admin/reviews/[id]`（論理削除解除）— spec は DELETE のみ                                           |
| 追加   | お問い合わせ系 Server Actions（`submitContactAction` / `updateContactStatusAction` / `replyToContactAction`） |
| 非実装 | `GET /api/spots`（スポット一覧）— Server Component が直接 DB 参照するため Route Handler なし                  |

---

## 6. 参考

- `docs/specs/api.md` — Route Handler 一覧の定義元
- `docs/design-docs/03_screen-list.md` — 画面ごとの Server Action 対応表
- `docs/specs/supabase-auth.md` — 認証実装ルール（`getUser()` 必須・`getSession()` 禁止）
- `docs/specs/database.md` — 論理削除・カスケードトリガーの詳細
