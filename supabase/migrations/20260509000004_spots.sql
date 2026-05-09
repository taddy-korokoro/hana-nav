-- spots: 花畑スポット本体
-- - location は人間が読む住所、coordinates は地図ピン・距離計算用
-- - is_published=false で投入し、管理者の出典確認後に true へ更新する運用
-- - best_season_* は月またぎ可（例: 12 -> 2）。クエリは isInBestSeason() を使う

CREATE TABLE public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_kana TEXT,
  description TEXT,
  prefecture_id SMALLINT NOT NULL REFERENCES public.prefectures(id),
  location TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  official_url TEXT,
  access_info TEXT,
  parking_info TEXT,
  entrance_fee TEXT,
  best_season_start SMALLINT NOT NULL CHECK (best_season_start BETWEEN 1 AND 12),
  best_season_end SMALLINT NOT NULL CHECK (best_season_end BETWEEN 1 AND 12),
  source TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX spots_coordinates_idx ON public.spots USING GIST (coordinates);
CREATE INDEX spots_prefecture_idx ON public.spots (prefecture_id);
CREATE INDEX spots_season_idx ON public.spots (best_season_start, best_season_end);
CREATE INDEX spots_published_idx ON public.spots (is_published) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spots
  BEFORE UPDATE ON public.spots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 論理削除時に紐づく images もカスケード論理削除
CREATE TRIGGER cascade_soft_delete_spot_images_trigger
  AFTER UPDATE ON public.spots
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_spot_images();

ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published spots are viewable by everyone"
  ON public.spots FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);
