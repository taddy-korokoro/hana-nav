# 17. 管理画面：ユーザー・レビュー・AI ログ

## 概要

ユーザー管理（ロール変更・BAN）、全レビューの監視・論理削除、AI 利用状況の集計画面を実装する。

## 依存チケット

- [15](./15_admin-spots.md)

## 関連ファイル

- `app/admin/users/page.tsx`
- `app/admin/users/[id]/page.tsx`
- `app/admin/reviews/page.tsx`
- `app/admin/ai-usage/page.tsx`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/reviews/route.ts`
- `app/api/admin/reviews/[id]/route.ts`
- `app/api/admin/ai-usage/stats/route.ts`
- `components/admin/UserTable.tsx`
- `components/admin/ReviewModerationTable.tsx`
- `components/admin/AiUsageChart.tsx`

## 関連 DB

`profiles`, `reviews`, `ai_usage_logs`, `bookmarks`

## TODO

### ユーザー一覧（`/admin/users`）

- [x] 全ユーザー一覧（論理削除含む、フィルタで切替）
- [x] 検索（username / email）— email は auth.users から join
- [x] ロール表示（user / admin）
- [x] ロール変更アクション（user ⇄ admin）
- [x] BAN ボタン（`profiles.deleted_at` セット）

### ユーザー詳細（`/admin/users/[id]`）

- [x] プロフィール表示
- [x] レビュー履歴
- [x] ブックマーク履歴
- [x] AI 利用履歴
- [x] BAN / ロール変更

### レビュー管理（`/admin/reviews`）

- [x] 全レビュー（論理削除含む、フィルタ可）
- [x] スポット名 / ユーザー名で検索
- [x] NG ワードフラグ（lib/ng-words ヒットを表示）
- [x] 強制論理削除アクション

### AI 利用ログ（`/admin/ai-usage`）

- [x] 日別 / 月別の集計（折れ線グラフ）
- [x] ユーザー別ランキング
- [x] 概算コスト推計（Gemini 単価 × 件数）
- [ ] CSV エクスポート（任意）

### Server Action / API

- [x] `GET /api/admin/users`
- [x] `PATCH /api/admin/users/[id]`（role / deleted_at）
- [x] `GET /api/admin/reviews`
- [x] `DELETE /api/admin/reviews/[id]`（論理削除）
- [x] `GET /api/admin/ai-usage/stats`
- [x] 全エンドポイントで `requireAdmin()` 呼び出し

### 動作確認

- [x] admin → user に降格すると次回ログイン時に `/admin` から弾かれる
- [x] 論理削除されたユーザーのレビューは「退会済ユーザー」表示になる
- [x] AI 利用集計が日別で正しく出る

## 完了基準

- [x] ユーザー管理ができる
- [x] レビューを論理削除できる
- [x] AI 利用状況が可視化される

## 参考

- [specs/pages.md](./specs/pages.md) — 管理者専用ページ
- [specs/database.md](./specs/database.md) — profiles / reviews / ai_usage_logs
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Server Action / 動的レンダリング
- [specs/supabase-auth.md](./specs/supabase-auth.md) — admin ロールチェック / Service Role の境界
