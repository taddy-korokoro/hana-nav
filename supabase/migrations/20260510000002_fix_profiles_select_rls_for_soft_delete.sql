-- profiles の SELECT ポリシーから `deleted_at IS NULL` を外す。
--
-- 背景: 退会フロー（`UPDATE profiles SET deleted_at = NOW()`）で PostgREST の RETURNING が
-- 更新後の行を SELECT で取り戻そうとし、SELECT ポリシー条件 `deleted_at IS NULL` を満たさず
-- 「new row violates row-level security policy for table "profiles"」（コード 42501）になる。
--
-- 解決: 共通ルール（docs/specs/database.md「共通ルール」）に従い、
--   - DB の SELECT ポリシーは `deleted_at IS NULL` を入れない
--   - フィルタはアプリ側 `.is('deleted_at', null)` で行う
-- bookmarks に対する `fix_bookmarks_select_rls_for_soft_delete` と同じ修正パターン。
--
-- 影響範囲: アプリ内の `from('profiles')` 全クエリは既に `.is('deleted_at', null)` を
-- 明示しているため挙動変わらず（lib/queries/mypage.ts, lib/utils/requireAdmin.ts,
-- lib/supabase/middleware.ts, components/layout/site-header.tsx）。

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);
