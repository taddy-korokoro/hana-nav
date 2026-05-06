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

- [ ] Supabase プロジェクトを作成（東京リージョン）
- [ ] PostGIS 拡張を有効化（`CREATE EXTENSION IF NOT EXISTS postgis`）
- [ ] Auth プロバイダ：Email + Google OAuth を有効化
- [ ] 接続情報を `.env.local` に設定

### 共通関数・トリガー

- [ ] `set_updated_at()` 関数を作成
- [ ] `handle_new_user()` 関数 + `on_auth_user_created` トリガー（profiles 自動作成）
- [ ] `validate_image_owner()` 関数 + INSERT/UPDATE トリガー
- [ ] `cascade_soft_delete_spot_images()` 関数 + トリガー
- [ ] `cascade_soft_delete_flower_images()` 関数 + トリガー

### テーブル作成

- [ ] `prefectures`（47件マスター、INSERT 含む）
- [ ] `profiles`（id, username, avatar_url, role, deleted_at）+ RLS
- [ ] `spots`（coordinates GEOGRAPHY, best_season_*, is_published）+ RLS + GIST インデックス
- [ ] `flowers`（name UNIQUE, default_season_*）+ RLS
- [ ] `flower_aliases`（alias UNIQUE）+ RLS
- [ ] `images`（owner_type/owner_id 多態関連、外部キー無し）+ RLS
- [ ] `spot_flowers`（中間テーブル、bloom_*_month）+ RLS
- [ ] `bookmarks`（user_id, spot_id, UNIQUE）+ RLS
- [ ] `reviews`（rating 1-5, comment ≤200）+ RLS
- [ ] `ai_usage_logs`（user_id or anonymous_id, used_at, reward_unlocked）+ RLS

### インデックス

- [ ] `spots_coordinates_idx`（GIST）
- [ ] `spots_prefecture_idx`, `spots_season_idx`, `spots_published_idx`
- [ ] `images_owner_idx`（owner_type, owner_id, display_order）
- [ ] `flower_aliases_flower_idx`, `flower_aliases_alias_idx`
- [ ] `spot_flowers_flower_idx`, `spot_flowers_bloom_idx`
- [ ] `bookmarks_user_idx`, `reviews_spot_idx`
- [ ] `ai_usage_logs_user_idx`, `ai_usage_logs_anon_idx`
- [ ] `profiles_role_idx`

### マスターデータ投入

- [ ] `prefectures` 47件を投入
- [ ] `flowers` 30種類以上を手動投入（桜・チューリップ・ひまわり・コスモス等）
- [ ] `flower_aliases` を整備（桜→ソメイヨシノ／ヤマザクラ／シダレザクラなど）
- [ ] 花マスターの代表画像を `images` に登録（owner_type='flower'）

### 動作確認

- [ ] 全テーブルで RLS が有効になっていることを確認
- [ ] ダミー spot を INSERT → 子 image を INSERT → spot を論理削除 → image も論理削除されることを確認
- [ ] images に存在しない owner_id を INSERT して拒否されることを確認

## 完了基準

- [ ] 全テーブルが本番想定どおりに作成されている
- [ ] RLS が全テーブルで有効
- [ ] prefectures 47件、flowers 30件以上、flower_aliases 整備済み
- [ ] 整合性トリガーが動作する

## 参考

- CLAUDE.md「8. データベース設計」
- CLAUDE.md「16. 技術的懸念点 - imagesテーブル整合性」
