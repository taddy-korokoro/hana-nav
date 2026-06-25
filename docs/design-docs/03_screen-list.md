# 03. 画面一覧

| 項目       | 値                            |
| ---------- | ----------------------------- |
| 参照 spec  | `docs/specs/pages.md`         |
| 関連タスク | T02 画面遷移図 / T04 API 一覧 |

---

## 1. 主要 15 画面

### 1-1. 公開ページ（SC-01〜SC-09）

| 画面 ID | 画面名         | URL                      | 認証要否 | 利用機能                                                                                             | 主な使用テーブル                                    |
| ------- | -------------- | ------------------------ | -------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| SC-01   | トップ         | `/`                      | 公開     | 見頃マップ表示、花の種類カルーセル、エリア選択、AI 判定訴求バナー                                    | spots, flowers, prefectures                         |
| SC-02   | スポット検索   | `/spots`                 | 公開     | エリア / 花種類 / 見頃月での絞り込み検索（URL `searchParams` ベース）、スポットカード一覧            | spots, flowers, prefectures, images                 |
| SC-03   | スポット詳細   | `/spots/[id]`            | 公開     | スポット情報・画像スライダー・地図ピン・見頃カレンダー・レビュー一覧・ブックマーク追加・楽天トラベル | spots, images, spot_flowers, flowers, reviews       |
| SC-04   | エリア別一覧   | `/areas/[prefecture_id]` | 公開     | 都道府県ごとのスポット一覧、見頃フィルタ                                                             | spots, prefectures, images                          |
| SC-05   | 花の種類一覧   | `/flowers`               | 公開     | 全花種類を 50 音順で表示、花名・見頃月でフィルタ                                                     | flowers, images                                     |
| SC-06   | 花の詳細       | `/flowers/[id]`          | 公開     | 花の特徴・花言葉・見頃時期、関連スポット一覧、楽天市場商品カード                                     | flowers, images, spots, spot_flowers                |
| SC-07   | AI 花判定      | `/identify`              | 公開     | カメラ起動 / 画像選択・プレビュー、残回数表示、画像アップロード・送信                                | ai_usage_logs                                       |
| SC-08   | AI 判定結果    | `/identify/result`       | 公開     | 判定花名・信頼度・花言葉表示、関連スポット一覧、しおり生成への導線                                   | flowers, images, spots, spot_flowers, ai_usage_logs |
| SC-09   | 旅のしおり生成 | `/identify/story`        | 公開     | Canvas API で縦長しおり画像を合成、Web Share API / SNS シェア                                        | クライアント完結（Canvas API）                      |

### 1-2. 認証ページ（SC-10〜SC-11）

| 画面 ID | 画面名   | URL            | 認証要否 | 利用機能                                                         | 主な使用テーブル |
| ------- | -------- | -------------- | -------- | ---------------------------------------------------------------- | ---------------- |
| SC-10   | ログイン | `/auth/login`  | 公開     | Email + Password / Google OAuth ログイン、パスワードリセット導線 | profiles         |
| SC-11   | 会員登録 | `/auth/signup` | 公開     | Email 新規登録 / Google OAuth 登録、メール確認フロー             | profiles         |

### 1-3. ログインユーザー専用ページ（SC-12〜SC-14）

| 画面 ID | 画面名           | URL                 | 認証要否 | 利用機能                                         | 主な使用テーブル         |
| ------- | ---------------- | ------------------- | -------- | ------------------------------------------------ | ------------------------ |
| SC-12   | マイページ       | `/mypage`           | 認証必須 | プロフィール確認、ブックマーク・レビューへの導線 | profiles                 |
| SC-13   | ブックマーク一覧 | `/mypage/bookmarks` | 認証必須 | 行きたいリストの表示・削除                       | bookmarks, spots, images |
| SC-14   | プロフィール編集 | `/mypage/profile`   | 認証必須 | username / avatar 編集、アカウント退会           | profiles                 |

### 1-4. 管理者専用ページ（SC-15）

| 画面 ID | 画面名             | URL      | 認証要否   | 利用機能                              | 主な使用テーブル     |
| ------- | ------------------ | -------- | ---------- | ------------------------------------- | -------------------- |
| SC-15   | 管理ダッシュボード | `/admin` | 管理者のみ | 公開待ちスポット数・AI 利用状況の俯瞰 | spots, ai_usage_logs |

---

## 2. 主要 15 画面外

### 2-1. 静的ページ

| 画面 ID | 画面名               | URL        | 認証要否 | 利用機能           | 主な使用テーブル |
| ------- | -------------------- | ---------- | -------- | ------------------ | ---------------- |
| SC-P1   | 利用規約             | `/terms`   | 公開     | 静的テキストページ | -                |
| SC-P2   | プライバシーポリシー | `/privacy` | 公開     | 静的テキストページ | -                |

### 2-2. 認証サブページ

| 画面 ID | 画面名                 | URL                     | 認証要否 | 利用機能                                          | 主な使用テーブル |
| ------- | ---------------------- | ----------------------- | -------- | ------------------------------------------------- | ---------------- |
| SC-A1   | パスワードリセット申請 | `/auth/reset-password`  | 公開     | リセットメール送信                                | profiles         |
| SC-A2   | パスワード更新         | `/auth/update-password` | 公開     | 新パスワード設定（メールリンク経由）              | profiles         |
| SC-A3   | OAuth コールバック     | `/auth/callback`        | -        | Google OAuth 完了後のセッション確立・リダイレクト | profiles         |

### 2-3. ログインユーザー専用サブページ

| 画面 ID | 画面名             | URL               | 認証要否 | 利用機能                             | 主な使用テーブル |
| ------- | ------------------ | ----------------- | -------- | ------------------------------------ | ---------------- |
| SC-U1   | 自分のレビュー一覧 | `/mypage/reviews` | 認証必須 | 自分が書いたレビューの一覧・論理削除 | reviews, spots   |

### 2-4. 管理者専用サブページ

| 画面 ID | 画面名               | URL                    | 認証要否   | 利用機能                                      | 主な使用テーブル                |
| ------- | -------------------- | ---------------------- | ---------- | --------------------------------------------- | ------------------------------- |
| SC-AD1  | スポット一覧         | `/admin/spots`         | 管理者のみ | 全スポット（未公開含む）一覧・絞り込み        | spots, prefectures              |
| SC-AD2  | スポット新規作成     | `/admin/spots/new`     | 管理者のみ | スポット手動作成、`is_published=false` で投入 | spots, images                   |
| SC-AD3  | 公開待ちスポット     | `/admin/spots/pending` | 管理者のみ | `is_published=false` 一覧・出典確認・公開     | spots                           |
| SC-AD4  | スポット詳細・編集   | `/admin/spots/[id]`    | 管理者のみ | スポット編集・画像管理・公開 on/off・論理削除 | spots, images                   |
| SC-AD5  | 花マスター管理       | `/admin/flowers`       | 管理者のみ | 花の追加・一覧表示                            | flowers, images                 |
| SC-AD6  | 花マスター詳細・編集 | `/admin/flowers/[id]`  | 管理者のみ | 花情報・別名（flower_aliases）・画像の編集    | flowers, images, flower_aliases |
| SC-AD7  | ユーザー管理         | `/admin/users`         | 管理者のみ | ユーザー一覧、role 変更（user ⇄ admin）       | profiles                        |
| SC-AD8  | ユーザー詳細         | `/admin/users/[id]`    | 管理者のみ | ユーザー詳細・レビュー履歴・BAN（論理削除）   | profiles, reviews, bookmarks    |
| SC-AD9  | レビュー管理         | `/admin/reviews`       | 管理者のみ | 全レビュー一覧・不適切レビューの論理削除      | reviews, profiles, spots        |
| SC-AD10 | AI 利用ログ          | `/admin/ai-usage`      | 管理者のみ | 日別 / 月別 AI 利用回数・コスト推計           | ai_usage_logs                   |
| SC-AD11 | 画像管理             | `/admin/images`        | 管理者のみ | 画像一覧・差し替え・論理削除（多態関連）      | images                          |

---

## 3. 全画面認証要否サマリ

| 区分       | 画面 ID                                         | 画面数 |
| ---------- | ----------------------------------------------- | ------ |
| 公開       | SC-01〜SC-11, SC-A1, SC-A2, SC-A3, SC-P1, SC-P2 | 16     |
| 認証必須   | SC-12, SC-13, SC-14, SC-U1                      | 4      |
| 管理者のみ | SC-15, SC-AD1〜SC-AD11                          | 12     |
| **合計**   |                                                 | **32** |

---

## 4. 画面ごとのコンポーネント・アクション対応

| 画面 ID | Page ファイル                        | 主要 Client Component                      | Server Action / Route Handler                  |
| ------- | ------------------------------------ | ------------------------------------------ | ---------------------------------------------- |
| SC-01   | `app/page.tsx`                       | 地図ピン、花カルーセル                     | -                                              |
| SC-02   | `app/spots/page.tsx`                 | フィルタフォーム（URL 更新）               | `GET /api/spots`                               |
| SC-03   | `app/spots/[id]/page.tsx`            | 画像スライダー、地図ピン、レビューフォーム | `POST /api/bookmarks`, `POST /api/reviews`     |
| SC-04   | `app/areas/[prefecture_id]/page.tsx` | -                                          | -                                              |
| SC-05   | `app/flowers/page.tsx`               | -                                          | -                                              |
| SC-06   | `app/flowers/[id]/page.tsx`          | 楽天商品カード（Client fetch）             | `GET /api/flowers/[id]`                        |
| SC-07   | `app/identify/page.tsx`              | カメラ / ファイル選択、プレビュー          | `POST /api/ai/identify-flower`                 |
| SC-08   | `app/identify/result/page.tsx`       | 判定結果カード                             | -                                              |
| SC-09   | `app/identify/story/page.tsx`        | `StoryCardGenerator`（Canvas API）         | -（クライアント完結）                          |
| SC-10   | `app/auth/login/page.tsx`            | ログインフォーム                           | `app/auth/login/actions.ts`                    |
| SC-11   | `app/auth/signup/page.tsx`           | 登録フォーム                               | `app/auth/signup/actions.ts`                   |
| SC-12   | `app/mypage/page.tsx`                | -                                          | -                                              |
| SC-13   | `app/mypage/bookmarks/page.tsx`      | ブックマーク削除ボタン                     | `DELETE /api/bookmarks/[spot_id]`              |
| SC-14   | `app/mypage/profile/page.tsx`        | アバターアップロード                       | `app/mypage/profile/actions.ts`                |
| SC-15   | `app/admin/page.tsx`                 | 統計カード                                 | -                                              |
| SC-AD1  | `app/admin/spots/page.tsx`           | -                                          | -                                              |
| SC-AD2  | `app/admin/spots/new/page.tsx`       | スポット入力フォーム                       | `createSpotAction`                             |
| SC-AD3  | `app/admin/spots/pending/page.tsx`   | -                                          | `togglePublishedAction`                        |
| SC-AD4  | `app/admin/spots/[id]/page.tsx`      | 画像アップロード                           | `updateSpotAction`, `softDeleteSpotAction`     |
| SC-AD5  | `app/admin/flowers/page.tsx`         | -                                          | `createFlowerAction`                           |
| SC-AD6  | `app/admin/flowers/[id]/page.tsx`    | 画像アップロード                           | `updateFlowerAction`, `softDeleteFlowerAction` |
| SC-AD7  | `app/admin/users/page.tsx`           | -                                          | -                                              |
| SC-AD8  | `app/admin/users/[id]/page.tsx`      | -                                          | `banUserAction`                                |
| SC-AD9  | `app/admin/reviews/page.tsx`         | -                                          | `softDeleteReviewAction`                       |
| SC-AD10 | `app/admin/ai-usage/page.tsx`        | 利用グラフ                                 | -                                              |
| SC-AD11 | `app/admin/images/page.tsx`          | 画像グリッド                               | `softDeleteImageAction`                        |

---

## 5. 参考

- `docs/specs/pages.md` — ページ構成・URL 設計・認証ルールの定義元
- `docs/design-docs/02_screen-flow.md` — 画面遷移図（SC-01〜SC-15 の番号と対応）
- `docs/design-docs/04_api-list.md` — Route Handler / Server Action 詳細（T04）
