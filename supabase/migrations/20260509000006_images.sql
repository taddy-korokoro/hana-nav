-- images: spots と flowers の画像を一元管理（多態関連）
-- - 外部キーは張れない（owner_type で参照先テーブルが切り替わるため）
-- - 整合性は 2 層で保証する：
--   A 層 = アプリ層の lib/utils/imageValidator.ts で INSERT 前チェック
--   B 層 = DB トリガー validate_image_owner_trigger で親存在検証

CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('spot', 'flower')),
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX images_owner_idx
  ON public.images (owner_type, owner_id, display_order)
  WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_images
  BEFORE UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INSERT/UPDATE 時に親（spot or flower）が存在し未削除であることを検証
CREATE TRIGGER validate_image_owner_trigger
  BEFORE INSERT OR UPDATE OF owner_type, owner_id ON public.images
  FOR EACH ROW EXECUTE FUNCTION public.validate_image_owner();

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images are viewable by everyone"
  ON public.images FOR SELECT USING (deleted_at IS NULL);
