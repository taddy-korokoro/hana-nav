-- spot_flowers: spots と flowers の中間テーブル
-- - bloom_*_month はスポット固有の開花月（最も正確）
--   NULL の場合は flowers.default_season_* をフォールバック表示する
-- - 主キーは (spot_id, flower_id) 複合（同一花は 1 スポット 1 行）

CREATE TABLE public.spot_flowers (
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  flower_id UUID NOT NULL REFERENCES public.flowers(id) ON DELETE CASCADE,
  bloom_start_month SMALLINT CHECK (bloom_start_month BETWEEN 1 AND 12),
  bloom_end_month SMALLINT CHECK (bloom_end_month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  PRIMARY KEY (spot_id, flower_id)
);

CREATE INDEX spot_flowers_flower_idx
  ON public.spot_flowers (flower_id) WHERE deleted_at IS NULL;
CREATE INDEX spot_flowers_bloom_idx
  ON public.spot_flowers (bloom_start_month, bloom_end_month) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spot_flowers
  BEFORE UPDATE ON public.spot_flowers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.spot_flowers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spot-flowers are viewable by everyone"
  ON public.spot_flowers FOR SELECT USING (deleted_at IS NULL);
