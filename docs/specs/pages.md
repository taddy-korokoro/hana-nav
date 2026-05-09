# ページ構成・URL設計

URL = ファイル構造で表現。認証保護は Next.js Middleware + Supabase Auth + RLS の3層で実施。

## 認証ルール

| ページ種別           | アクセス可能な権限           | 未ログイン時の挙動           |
| -------------------- | ---------------------------- | ---------------------------- |
| 公開ページ           | 全員（匿名OK）               | アクセス可能                 |
| ログインユーザー専用 | ログイン済み（user / admin） | `/auth/login` へリダイレクト |
| 管理者専用           | admin のみ                   | `/auth/login` へリダイレクト |

管理者判定は `profiles.role = 'admin'` で行う。初期管理者は Supabase Dashboard から手動付与：

```sql
UPDATE profiles SET role = 'admin' WHERE id = '...';
```

## 公開ページ一覧

| 画面名               | URL                      | 概要                                                 | 主な使用テーブル                                    |
| -------------------- | ------------------------ | ---------------------------------------------------- | --------------------------------------------------- |
| トップ               | `/`                      | 見頃マップ、花の種類検索                             | spots, flowers, prefectures                         |
| スポット検索         | `/spots`                 | 絞り込み検索                                         | spots, flowers, prefectures, images                 |
| スポット詳細         | `/spots/[id]`            | 地図、花、レビュー、地図ピン                         | spots, images, spot_flowers, flowers, reviews       |
| エリア別一覧         | `/areas/[prefecture_id]` | 都道府県ごとのスポット一覧                           | spots, prefectures                                  |
| 花の種類一覧         | `/flowers`               | 全花種類の一覧（50音順）                             | flowers, images                                     |
| 花の詳細             | `/flowers/[id]`          | 花の特徴、花言葉、見頃時期、その花が見られるスポット | flowers, images, spots, spot_flowers                |
| AI花判定             | `/identify`              | カメラ起動 or 画像選択で花を判定する入口画面         | ai_usage_logs                                       |
| AI判定結果           | `/identify/result`       | 判定結果表示（PictureThis風UI）、関連スポット        | flowers, images, spots, spot_flowers, ai_usage_logs |
| 旅のしおり生成       | `/identify/story`        | Canvas APIで縦長画像を生成 → SNSシェア               | クライアント完結                                    |
| 利用規約             | `/terms`                 | 静的ページ                                           | -                                                   |
| プライバシーポリシー | `/privacy`               | 静的ページ                                           | -                                                   |
| 特定商取引法など     | `/legal`                 | 静的ページ                                           | -                                                   |

## 認証ページ一覧

| 画面名                 | URL                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| ログイン               | `/auth/login`                                                                               |
| 会員登録               | `/auth/signup`                                                                              |
| パスワードリセット申請 | `/auth/reset-password`                                                                      |
| パスワード更新         | `/auth/update-password`                                                                     |
| OAuthコールバック      | `/auth/callback`（Route Handler）                                                           |
| ログアウト             | Server Action `app/auth/logout/actions.ts`（UI は `<form action={logout}>`、独立 URL なし） |

## ログインユーザー専用ページ

| 画面名             | URL                 | 概要                                         | 主な使用テーブル         |
| ------------------ | ------------------- | -------------------------------------------- | ------------------------ |
| マイページ         | `/mypage`           | プロフィール、ブックマーク・レビューへの導線 | profiles                 |
| プロフィール編集   | `/mypage/profile`   | username, avatar 編集                        | profiles                 |
| ブックマーク一覧   | `/mypage/bookmarks` | 自分の行きたいリスト                         | bookmarks, spots, images |
| 自分のレビュー一覧 | `/mypage/reviews`   | 自分が書いたレビューの一覧・編集             | reviews, spots           |

## 管理者専用ページ（`/admin/*`）

全ページ admin ロール必須。Next.js Middleware で認証・権限チェック。

| 画面名               | URL                    | 概要                                        | 主な使用テーブル             |
| -------------------- | ---------------------- | ------------------------------------------- | ---------------------------- |
| 管理ダッシュボード   | `/admin`               | 公開待ちスポット数、AI利用状況など          | spots, ai_usage_logs         |
| スポット一覧         | `/admin/spots`         | 全スポット（未公開含む）一覧                | spots, prefectures           |
| スポット新規作成     | `/admin/spots/new`     | 手動でスポットを作成                        | spots, images                |
| 公開待ちスポット     | `/admin/spots/pending` | is_published=false の一覧                   | spots                        |
| スポット詳細・編集   | `/admin/spots/[id]`    | 出典を確認して公開                          | spots, images                |
| 花マスター管理       | `/admin/flowers`       | 花の追加・編集・画像登録                    | flowers, images              |
| 花マスター詳細・編集 | `/admin/flowers/[id]`  | 花情報・画像の編集                          | flowers, images              |
| ユーザー管理         | `/admin/users`         | ユーザー一覧、role変更（user ⇄ admin）      | profiles                     |
| ユーザー詳細         | `/admin/users/[id]`    | ユーザー詳細、レビュー履歴、BAN（論理削除） | profiles, reviews, bookmarks |
| レビュー管理         | `/admin/reviews`       | 全レビュー一覧、不適切レビューの論理削除    | reviews, profiles, spots     |
| AI利用ログ           | `/admin/ai-usage`      | 日別/月別のAI利用回数、コスト推計           | ai_usage_logs                |
| 画像管理             | `/admin/images`        | 画像一覧・差し替え・論理削除                | images                       |
