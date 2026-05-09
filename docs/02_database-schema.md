# 02. DB スキーマ + RLS + マスター投入

## 概要

Supabase プロジェクトを作成し、全テーブル・トリガー・RLS ポリシー・マスターデータを投入する。論理削除運用を徹底する。

## 依存チケット

- [01](./01_project-setup.md)

## 関連ファイル

- `supabase/migrations/*.sql`（マイグレーションファイル）
- `supabase/seed.sql`（マスターデータ）

## 関連 DB

`prefectures`, `profiles`, `spots`, `flowers`, `flower_aliases`, `images`, `spot_flowers`, `bookmarks`, `reviews`, `ai_usage_logs`

## TODO

### Supabase プロジェクト準備

- [x] Supabase プロジェクトを作成（東京リージョン）（プロジェクト ID: `ylteqolybajeczjyjevw`、`ap-northeast-1`）
- [x] PostGIS 拡張を有効化（`CREATE EXTENSION IF NOT EXISTS postgis`）（migration `20260509000001_extensions_and_functions.sql` で適用）
- [x] Auth プロバイダ：Email + Google OAuth を有効化（Dashboard 上で手動設定済み）
- [x] 接続情報を `.env.local` に設定（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を投入済み）

### 共通関数・トリガー

- [x] `set_updated_at()` 関数を作成
- [x] `handle_new_user()` 関数 + `on_auth_user_created` トリガー（profiles 自動作成）
- [x] `validate_image_owner()` 関数 + INSERT/UPDATE トリガー
- [x] `cascade_soft_delete_spot_images()` 関数 + トリガー
- [x] `cascade_soft_delete_flower_images()` 関数 + トリガー

### テーブル作成

- [x] `prefectures`（47件マスター、INSERT 含む）
- [x] `profiles`（id, username, avatar_url, role, deleted_at）+ RLS
- [x] `spots`（coordinates GEOGRAPHY, best*season*\*, is_published）+ RLS + GIST インデックス
- [x] `flowers`（name UNIQUE, default*season*\*）+ RLS
- [x] `flower_aliases`（alias UNIQUE）+ RLS
- [x] `images`（owner_type/owner_id 多態関連、外部キー無し）+ RLS
- [x] `spot_flowers`（中間テーブル、bloom\_\*\_month）+ RLS
- [x] `bookmarks`（user_id, spot_id, UNIQUE）+ RLS
- [x] `reviews`（rating 1-5, comment ≤200）+ RLS
- [x] `ai_usage_logs`（user_id or anonymous_id, used_at, reward_unlocked）+ RLS

### インデックス

- [x] `spots_coordinates_idx`（GIST）
- [x] `spots_prefecture_idx`, `spots_season_idx`, `spots_published_idx`
- [x] `images_owner_idx`（owner_type, owner_id, display_order）
- [x] `flower_aliases_flower_idx`, `flower_aliases_alias_idx`
- [x] `spot_flowers_flower_idx`, `spot_flowers_bloom_idx`
- [x] `bookmarks_user_idx`, `reviews_spot_idx`
- [x] `ai_usage_logs_user_idx`, `ai_usage_logs_anon_idx`
- [x] `profiles_role_idx`

### マスターデータ投入

- [x] `prefectures` 47件を投入（migration `20260509000002_prefectures.sql`）
- [x] `flowers` 30種類以上を手動投入（`supabase/seed.sql` で 32 種：桜・チューリップ・ひまわり・コスモス等）
- [x] `flower_aliases` を整備（`supabase/seed.sql` で約 100 件：桜→ソメイヨシノ／ヤマザクラ／シダレザクラなど）

> 花マスターの代表画像（`images.owner_type='flower'`）は本チケットでは投入しない。CLAUDE.md のグラデーションプレースホルダー運用で MVP 中は動かす。
>
> - ホスティング方針の決定 → チケット [08](./08_flower-pages.md)
> - 検証用に 1〜2 種を投入 → チケット [11](./11_ai-identify.md)
> - 残 30 種を一括 curate → チケット [16](./16_admin-content.md)
> - ローンチ前最終確認 → チケット [21](./21_deploy-launch.md)

### 動作確認

`supabase/sanity-checks.sql` を Supabase Dashboard の SQL Editor で順に実行する（マイグレーション適用後の手動チェック用スクリプト）。

- [x] 全テーブルで RLS が有効になっていることを確認（10/10 テーブルで `rowsecurity=true`）
- [x] ダミー spot を INSERT → 子 image を INSERT → spot を論理削除 → image も論理削除されることを確認（DO ブロックで検証済み）
- [x] images に存在しない owner_id を INSERT して拒否されることを確認（`validate_image_owner_trigger` で例外発生を確認）

## 完了基準

- [x] 全テーブルが本番想定どおりに作成されている（10 テーブル + 5 カスタム関数）
- [x] RLS が全テーブルで有効
- [x] prefectures 47件、flowers 32件、flower_aliases 100件
- [x] 整合性トリガーが動作する（カスケード論理削除・親存在検証ともに OK）

## セキュリティアドバイザー対応状況

`mcp__supabase__get_advisors`（security）の指摘とその対応：

| 指摘                                                                          | レベル    | 対応                                                                                                  |
| ----------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| 自作関数 5 つの `search_path` 未設定                                          | WARN × 5  | ✅ migration `20260509000011_security_hardening.sql` で `SET search_path = public, pg_catalog` を追加 |
| `handle_new_user`（SECURITY DEFINER）が anon / authenticated から呼べる       | WARN × 2  | ✅ 同 migration で `REVOKE EXECUTE`                                                                   |
| PostGIS 拡張が `public` スキーマにある                                        | WARN × 1  | ⚠️ **受容**（PostGIS 3.3 は `ALTER EXTENSION ... SET SCHEMA` 未サポート）                             |
| `spatial_ref_sys` テーブルに RLS 無し                                         | ERROR × 1 | ⚠️ **受容**（PostGIS の参照定数テーブル。SRID 定義のみで実害なし）                                    |
| `st_estimatedextent` 系（SECURITY DEFINER）が anon / authenticated から呼べる | WARN × 6  | ⚠️ **受容**（PostGIS 内蔵関数。機密性なし）                                                           |

PostGIS 由来の WARN/ERROR は PostGIS 3.4+ への upgrade（または DROP→再 CREATE による破壊的移行）で解消可能だが、本 MVP では実害が無いため受容する。Supabase 側で Postgres + PostGIS のメジャーアップグレードが提供されたタイミングで再評価する。

## 参考

- [specs/database.md](./specs/database.md)
- [specs/operations.md](./specs/operations.md) — images テーブル整合性
- CLAUDE.md「プロジェクト共通規約 - 論理削除 / images テーブル整合性」
