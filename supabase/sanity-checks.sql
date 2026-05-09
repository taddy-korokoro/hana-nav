-- ============================================================================
-- マイグレーション適用後の動作確認 SQL（手動実行用）
-- ============================================================================
-- Supabase Dashboard の SQL Editor で 1 ブロックずつ実行し、結果を確認する。
-- すべて期待結果が得られれば 02_database-schema.md の「動作確認」TODO を満たす。
--
-- このファイルは migrations/ ではなく、開発者が手で叩く検証スクリプト。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (1) 全テーブルで RLS が有効になっていること
--     期待: 全行で rowsecurity=true（prefectures 含む）
-- ----------------------------------------------------------------------------
SELECT schemaname, tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN (
     'prefectures', 'profiles', 'spots', 'flowers', 'flower_aliases',
     'images', 'spot_flowers', 'bookmarks', 'reviews', 'ai_usage_logs'
   )
 ORDER BY tablename;


-- ----------------------------------------------------------------------------
-- (2) spots の論理削除で images もカスケード論理削除されること
--     セッション内で完結させたいので BEGIN/ROLLBACK で囲んで実行する。
-- ----------------------------------------------------------------------------
BEGIN;

WITH new_spot AS (
  INSERT INTO public.spots (
    name, prefecture_id, location, coordinates,
    best_season_start, best_season_end, is_published
  ) VALUES (
    '__sanity_check_spot__', 13, '東京都千代田区',
    ST_SetSRID(ST_MakePoint(139.7671, 35.6812), 4326)::geography,
    4, 5, false
  ) RETURNING id
)
INSERT INTO public.images (owner_type, owner_id, url, display_order)
SELECT 'spot', id, 'https://example.com/test.jpg', 0 FROM new_spot;

-- 親スポット ID を確認
SELECT id, deleted_at FROM public.spots WHERE name = '__sanity_check_spot__';

-- 子 image が見えること（deleted_at IS NULL）
SELECT i.id, i.owner_type, i.owner_id, i.deleted_at
  FROM public.images i
  JOIN public.spots s ON s.id = i.owner_id
 WHERE s.name = '__sanity_check_spot__';

-- 親を論理削除
UPDATE public.spots SET deleted_at = NOW() WHERE name = '__sanity_check_spot__';

-- 子 image も deleted_at が入っていることを確認（カスケード論理削除）
-- 期待: deleted_at IS NOT NULL
SELECT i.id, i.deleted_at
  FROM public.images i
  JOIN public.spots s ON s.id = i.owner_id
 WHERE s.name = '__sanity_check_spot__';

ROLLBACK;


-- ----------------------------------------------------------------------------
-- (3) images に存在しない owner_id を INSERT して拒否されること
--     期待: ERROR: owner_id ... does not exist in spot table
-- ----------------------------------------------------------------------------
BEGIN;

INSERT INTO public.images (owner_type, owner_id, url, display_order)
VALUES ('spot', '00000000-0000-0000-0000-000000000000', 'https://example.com/x.jpg', 0);

ROLLBACK;


-- ----------------------------------------------------------------------------
-- (4) prefectures が 47 件投入されていること
--     期待: count = 47
-- ----------------------------------------------------------------------------
SELECT COUNT(*) AS prefectures_count FROM public.prefectures;


-- ----------------------------------------------------------------------------
-- (5) flowers が 30 件以上投入されていること
--     期待: count >= 30
-- ----------------------------------------------------------------------------
SELECT COUNT(*) AS flowers_count
  FROM public.flowers
 WHERE deleted_at IS NULL;


-- ----------------------------------------------------------------------------
-- (6) flower_aliases が代表的な品種・表記揺れをカバーしていること
--     期待: 桜系の alias が複数行ヒット
-- ----------------------------------------------------------------------------
SELECT f.name, fa.alias
  FROM public.flower_aliases fa
  JOIN public.flowers f ON f.id = fa.flower_id
 WHERE fa.deleted_at IS NULL AND f.name = '桜'
 ORDER BY fa.alias;
