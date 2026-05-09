-- セキュリティアドバイザー指摘の対応（1-a / 1-b）
-- ----------------------------------------------------------------------------
-- 1-a: 自作関数 5 つに `SET search_path` を明示する。
--      未設定だと search_path ハイジャック攻撃の対象になり得るため、
--      Supabase Linter が WARN を出している（特に SECURITY DEFINER で危険）。
--      関数本体は `public.images` のようにスキーマ修飾しているので副作用なし。
--
-- 1-b: handle_new_user は `auth.users` への INSERT トリガー用の SECURITY DEFINER
--      関数だが、PostgREST 経由（/rest/v1/rpc/handle_new_user）で anon /
--      authenticated から直接呼べてしまう。トリガーは postgres ロール権限で動く
--      ため EXECUTE を REVOKE しても自動 profiles 作成には影響しない。
-- ----------------------------------------------------------------------------

-- 1-a: search_path を固定（CREATE OR REPLACE で 11 番目の migration として再定義）

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.validate_image_owner()
RETURNS TRIGGER AS $$
DECLARE
  exists_count INTEGER;
BEGIN
  IF NEW.owner_type = 'spot' THEN
    SELECT COUNT(*) INTO exists_count FROM public.spots
    WHERE id = NEW.owner_id AND deleted_at IS NULL;
  ELSIF NEW.owner_type = 'flower' THEN
    SELECT COUNT(*) INTO exists_count FROM public.flowers
    WHERE id = NEW.owner_id AND deleted_at IS NULL;
  ELSE
    RAISE EXCEPTION 'Invalid owner_type: %', NEW.owner_type;
  END IF;

  IF exists_count = 0 THEN
    RAISE EXCEPTION 'owner_id % does not exist in % table', NEW.owner_id, NEW.owner_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_spot_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.images SET deleted_at = NOW()
    WHERE owner_type = 'spot' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_flower_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.images SET deleted_at = NOW()
    WHERE owner_type = 'flower' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;


-- 1-b: handle_new_user の EXECUTE 権限を anon / authenticated / public から REVOKE
--      auth.users への INSERT トリガー（postgres ロール権限）からは引き続き呼べる。

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
