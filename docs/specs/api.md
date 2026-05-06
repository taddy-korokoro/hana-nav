# API エンドポイント

Route Handlers として `app/api/**/route.ts` に実装する。Mutation は原則 Server Actions を使い、Route Handler は外部呼び出し（AI 判定など）と REST 的な公開 API に絞る。

## ユーザー向け

認証が必要なエンドポイントは `getUser()` で確認。

| メソッド | エンドポイント | 概要 | 認証 |
|---|---|---|---|
| GET | `/api/spots` | スポット一覧（クエリで絞り込み: prefecture, flower, month） | 不要 |
| GET | `/api/spots/[id]` | スポット詳細 | 不要 |
| GET | `/api/flowers` | 花マスター一覧 | 不要 |
| GET | `/api/flowers/[id]` | 花の詳細 | 不要 |
| GET | `/api/prefectures` | 都道府県マスター（地方区分でグループ化可） | 不要 |
| POST | `/api/ai/identify-flower` | AI 花判定（画像送信→花情報+関連スポット返却） | 不要（レート制限あり） |
| POST | `/api/bookmarks` | ブックマーク追加 | 必要 |
| DELETE | `/api/bookmarks/[spot_id]` | ブックマーク削除（論理削除） | 必要 |
| GET | `/api/me/bookmarks` | 自分のブックマーク一覧 | 必要 |
| PATCH | `/api/me/profile` | プロフィール更新 | 必要 |

## 管理者向け

全エンドポイントで `getUser()` → `profiles.role === 'admin'` のチェックを共通ユーティリティ `requireAdmin()` で行う。

| メソッド | エンドポイント | 概要 |
|---|---|---|
| GET | `/api/admin/spots` | 全スポット（未公開含む）一覧 |
| POST | `/api/admin/spots` | スポット新規作成 |
| PATCH | `/api/admin/spots/[id]` | スポット更新・公開フラグ変更 |
| GET | `/api/admin/flowers` | 花マスター一覧 |
| POST | `/api/admin/flowers` | 花マスター新規作成 |
| PATCH | `/api/admin/flowers/[id]` | 花マスター更新 |
| GET | `/api/admin/users` | ユーザー一覧 |
| PATCH | `/api/admin/users/[id]` | ユーザー role 変更等 |
| GET | `/api/admin/reviews` | 全レビュー（管理用） |
| DELETE | `/api/admin/reviews/[id]` | レビュー強制論理削除 |
| GET | `/api/admin/ai-usage/stats` | AI 利用状況の集計 |
