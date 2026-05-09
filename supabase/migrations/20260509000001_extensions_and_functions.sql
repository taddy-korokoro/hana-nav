-- 拡張機能と共通関数
-- PostGIS（spots.coordinates の GEOGRAPHY 型で使用）と、
-- 全テーブル共通で使うトリガー関数群を定義する。

CREATE EXTENSION IF NOT EXISTS postgis;

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- auth.users への INSERT に追従して profiles を作成する関数
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- images テーブル INSERT/UPDATE 時に親レコードの存在を検証する関数（B 層）
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
$$ LANGUAGE plpgsql;

-- spots を論理削除した際に紐づく images もカスケード論理削除する関数
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_spot_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.images SET deleted_at = NOW()
    WHERE owner_type = 'spot' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- flowers を論理削除した際に紐づく images もカスケード論理削除する関数
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_flower_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.images SET deleted_at = NOW()
    WHERE owner_type = 'flower' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
