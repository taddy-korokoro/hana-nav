-- public な Storage バケット `avatars` を作成。`/mypage/profile` のアバターアップロードで使う。
--
-- 設計概要:
--   - 公開バケット（public=true）。`profiles.avatar_url` に公開 URL を格納
--   - file_size_limit: 5MB（クライアント側で 1024px / JPEG 0.8 にリサイズ後にアップロード）
--   - allowed_mime_types: jpeg / png / webp
--   - パス規約: `{user_id}/avatar-{timestamp}.jpg`
--   - INSERT / UPDATE / DELETE は本人の `{user_id}/...` 配下のみ。SELECT は public
--
-- 詳細は docs/specs/tech-stack.md「画像ホスティング」「`avatars` バケット初期化」を参照。

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- RLS (storage.objects)
--   - SELECT は public（バケット public=true のため CDN 経由で取得可）
--   - INSERT / UPDATE / DELETE は `auth.uid()` のフォルダ配下のみ
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own avatar folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload to own avatar folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
