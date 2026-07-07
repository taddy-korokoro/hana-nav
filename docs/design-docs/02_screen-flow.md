# 02. 画面遷移図

| 項目       | 値                                |
| ---------- | --------------------------------- |
| 参照 spec  | `docs/specs/pages.md`             |
| 関連タスク | T01 要件定義サマリ / T03 画面一覧 |

---

## 1. 主要画面一覧（15 画面）

| #   | 画面 ID | 画面名             | URL                      | 認証要否   |
| --- | ------- | ------------------ | ------------------------ | ---------- |
| 1   | SC-01   | トップ             | `/`                      | 公開       |
| 2   | SC-02   | スポット検索       | `/spots`                 | 公開       |
| 3   | SC-03   | スポット詳細       | `/spots/[id]`            | 公開       |
| 4   | SC-04   | エリア別一覧       | `/areas/[prefecture_id]` | 公開       |
| 5   | SC-05   | 花の種類一覧       | `/flowers`               | 公開       |
| 6   | SC-06   | 花の詳細           | `/flowers/[id]`          | 公開       |
| 7   | SC-07   | AI 花判定          | `/identify`              | 公開       |
| 8   | SC-08   | AI 判定結果        | `/identify/result`       | 公開       |
| 9   | SC-09   | 旅のしおり生成     | `/identify/story`        | 公開       |
| 10  | SC-10   | ログイン           | `/auth/login`            | 公開       |
| 11  | SC-11   | 会員登録           | `/auth/signup`           | 公開       |
| 12  | SC-12   | マイページ         | `/mypage`                | 認証必須   |
| 13  | SC-13   | ブックマーク一覧   | `/mypage/bookmarks`      | 認証必須   |
| 14  | SC-14   | プロフィール編集   | `/mypage/profile`        | 認証必須   |
| 15  | SC-15   | 管理ダッシュボード | `/admin`                 | 管理者のみ |

### 認証ページ（主要 15 画面外）

| 画面名                 | URL                       | 認証要否 |
| ---------------------- | ------------------------- | -------- |
| パスワードリセット申請 | `/auth/reset-password`    | 公開     |
| パスワード更新         | `/auth/update-password`   | 公開     |
| OAuth コールバック     | `/auth/callback`（Route） | -        |

### 管理者サブページ（主要 15 画面外）

| 画面名               | URL                    | 認証要否   |
| -------------------- | ---------------------- | ---------- |
| スポット一覧         | `/admin/spots`         | 管理者のみ |
| スポット新規作成     | `/admin/spots/new`     | 管理者のみ |
| 公開待ちスポット     | `/admin/spots/pending` | 管理者のみ |
| スポット詳細・編集   | `/admin/spots/[id]`    | 管理者のみ |
| 花マスター管理       | `/admin/flowers`       | 管理者のみ |
| 花マスター詳細・編集 | `/admin/flowers/[id]`  | 管理者のみ |
| ユーザー管理         | `/admin/users`         | 管理者のみ |
| ユーザー詳細         | `/admin/users/[id]`    | 管理者のみ |
| レビュー管理         | `/admin/reviews`       | 管理者のみ |
| AI 利用ログ          | `/admin/ai-usage`      | 管理者のみ |
| 画像管理             | `/admin/images`        | 管理者のみ |

---

## 2. 画面遷移図

### 2-1. 全体フロー（ユーザー向け）

> どの画面からでもナビゲーションバー経由でトップへ戻れる。

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart LR
    subgraph sg1["ユーザー向けフロー"]
        direction LR
        TOP[トップ]

        TOP --> SPOTS[スポット検索]
        SPOTS --> SPOT_DETAIL[スポット詳細]

        TOP --> AREA[エリア別一覧]
        AREA --> SPOT_DETAIL2[スポット詳細]

        TOP --> FLOWERS[花の種類一覧]
        FLOWERS --> FLOWER_DETAIL[花の詳細]
        FLOWER_DETAIL --> SPOT_DETAIL3[スポット詳細]

        TOP --> IDENTIFY[AI 花判定]
        IDENTIFY --> RESULT[AI 判定結果]
        RESULT --> STORY[旅のしおり生成]

        TOP --> LOGIN[ログイン]
        LOGIN --> MYPAGE[マイページ]
        MYPAGE --> BOOKMARKS[ブックマーク一覧]

        TOP --> LOGIN2[ログイン]
        LOGIN2 --> MYPAGE2[マイページ]
        MYPAGE2 --> PROFILE[プロフィール編集]

        TOP --> LOGIN3[ログイン]
        LOGIN3 --> MYPAGE3[マイページ]
        MYPAGE3 --> REVIEWS[レビュー一覧]

        TOP --> SIGNUP[会員登録]
        SIGNUP --> SIGNUP_DONE[会員登録完了]

        TOP --> TERMS[利用規約]
        TOP --> PRIVACY[プライバシーポリシー]
    end
```

### 2-2. 認証フロー

> ログイン済み状態から任意のタイミングでログアウト可能。パスワード更新後はログイン画面に遷移する。

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart LR
    subgraph sg2["認証フロー"]
        direction LR
        A1[未ログイン] --> A2[ログイン] -->|Email 認証| A3[ログイン済み]
        B1[未ログイン] --> B2[ログイン] -->|Google ログイン| B3[OAuth コールバック] --> B4[ログイン済み]
        C1[未ログイン] --> C2[ログイン] -->|パスワードを忘れた| C3[リセット申請] --> C4[パスワード更新]
        D1[未ログイン] --> D2[会員登録] -->|メール確認後| D3[ログイン済み]
        E1[未ログイン] --> E2[会員登録] -->|Google 登録| E3[OAuth コールバック] --> E4[ログイン済み]
    end
```

### 2-3. 認証必須ページのリダイレクト

> 認証・権限確認後は元のページへリダイレクトされる。

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart LR
    subgraph sg3["リダイレクト"]
        direction LR
        A1[未ログイン] -->|直接アクセス| A2[認証必須ページ] -->|Middleware リダイレクト| A3[ログイン] -->|認証成功| A4[ログイン済み] --> A5[元ページ（認証必須）]
        B1[未ログイン] -->|直接アクセス| B2[管理者専用ページ] -->|Middleware リダイレクト| B3[ログイン] -->|admin 認証成功| B4[admin ロール] --> B5[元ページ（管理者専用）]
    end
```

### 2-4. 管理者フロー

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart LR
    subgraph sg4["管理者フロー"]
        direction LR
        ADMIN[管理ダッシュボード]

        ADMIN --> SPOTS_LIST[スポット一覧]
        SPOTS_LIST --> SPOTS_NEW[スポット新規作成]
        SPOTS_LIST --> SPOTS_EDIT[スポット詳細・編集]

        ADMIN --> SPOTS_PENDING[公開待ちスポット]
        SPOTS_PENDING --> SPOTS_EDIT2[スポット詳細・編集]

        ADMIN --> FLOWERS_LIST[花マスター一覧]
        FLOWERS_LIST --> FLOWERS_EDIT[花マスター編集]
        FLOWERS_EDIT --> IMAGES[画像管理]

        ADMIN --> USERS[ユーザー一覧]
        USERS --> USERS_DETAIL[ユーザー詳細]
        USERS_DETAIL --> REVIEWS[レビュー管理]

        ADMIN --> AI_USAGE[AI 利用ログ]
    end
```

---

## 3. 認証要否サマリ

| 区分           | 対象 URL                                                                 | 未ログイン時の挙動                           |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| 公開           | `/` `/spots/*` `/areas/*` `/flowers/*` `/identify/*` `/terms` `/privacy` | そのまま表示                                 |
| 認証必須       | `/mypage/*`                                                              | `/auth/login` へリダイレクト                 |
| 管理者のみ     | `/admin/*`                                                               | `/auth/login` へリダイレクト                 |
| 認証ページ自体 | `/auth/*`                                                                | ログイン済みならトップへリダイレクト（任意） |

保護の実装は Next.js Middleware（`middleware.ts`）で `supabase.auth.getUser()` を呼び、パス別にリダイレクトを分岐する。管理者判定は `profiles.role = 'admin'` で行う。

---

## 4. 主要動線の完了確認

| 動線                                 | 対応する遷移（ダイアグラム番号）     |
| ------------------------------------ | ------------------------------------ |
| TOP → 検索 → 詳細                    | 2-1（TOP→SC-02→SC-03）               |
| TOP → エリア → 詳細                  | 2-1（TOP→SC-04→SC-03）               |
| TOP → 花一覧 → 花詳細 → スポット詳細 | 2-1（TOP→SC-05→SC-06→SC-03）         |
| スポット詳細 → AI 判定 → 結果        | 2-1（SC-03→SC-07→SC-08）             |
| AI 判定 → しおり生成 → SNS シェア    | 2-1（SC-07→SC-08→SC-09）             |
| 未ログイン → ログイン → マイページ   | 2-2 + 2-3                            |
| スポット詳細 → ブックマーク          | 2-3（SC-03→SC-13）                   |
| 管理者：公開待ちスポットを公開       | 2-4（SPOTS_PENDING→SPOTS_EDIT→公開） |

---

## 5. 参考

- `docs/specs/pages.md` — ページ構成・URL 設計・認証ルールの定義元
- `docs/specs/supabase-auth.md` — Middleware の認証実装詳細
- `docs/design-docs/01_requirements.md` — F-01〜F-12 と主要ユーザー導線
