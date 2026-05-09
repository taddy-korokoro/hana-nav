-- public な Storage バケット `images` を 1 本作成し、spot / flower 双方の代表画像をここで管理する。
-- バケットを 1 本に統一する理由・パス規約は docs/specs/tech-stack.md「画像ホスティング」を参照。
--
-- 設計概要:
--   - 公開バケット（public=true）。`images.url` には公開 URL を格納する
--   - file_size_limit: 2MB（CLAUDE.md「コスト・セキュリティ境界」準拠、クライアントリサイズ後の上限）
--   - allowed_mime_types: jpeg / png / webp（gif / svg は許可しない）
--   - SELECT のみ public 許可。INSERT / UPDATE / DELETE は service role のみ
--     （管理画面の Route Handler から SUPABASE_SERVICE_ROLE_KEY で書き込む前提）
--
-- 冪等性: ON CONFLICT で再適用しても壊れないようにする。

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- RLS (storage.objects)
--   anon / authenticated は SELECT のみ。INSERT / UPDATE / DELETE は service role のみ。
--   service role は RLS をバイパスするので明示的なポリシーは不要。
-- ----------------------------------------------------------------------------

-- 既存ポリシーがあっても作り直せるよう、まず DROP IF EXISTS する
DROP POLICY IF EXISTS "Public read access on images bucket" ON storage.objects;

CREATE POLICY "Public read access on images bucket"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');
