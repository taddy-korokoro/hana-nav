-- flowers: 花マスター（総称、例: 桜・チューリップ）
-- flower_aliases: AI 判定で返ってくる品種名・表記揺れを総称に紐付ける
-- alias は全体でユニーク（マッチング時にあいまい性を残さない）

CREATE TABLE public.flowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_season_start SMALLINT CHECK (default_season_start BETWEEN 1 AND 12),
  default_season_end SMALLINT CHECK (default_season_end BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_updated_at_flowers
  BEFORE UPDATE ON public.flowers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 論理削除時に紐づく images もカスケード論理削除
CREATE TRIGGER cascade_soft_delete_flower_images_trigger
  AFTER UPDATE ON public.flowers
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_flower_images();

ALTER TABLE public.flowers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flowers are viewable by everyone"
  ON public.flowers FOR SELECT USING (deleted_at IS NULL);


CREATE TABLE public.flower_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_id UUID NOT NULL REFERENCES public.flowers(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (alias)
);

CREATE INDEX flower_aliases_flower_idx ON public.flower_aliases (flower_id) WHERE deleted_at IS NULL;
CREATE INDEX flower_aliases_alias_idx ON public.flower_aliases (alias) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_flower_aliases
  BEFORE UPDATE ON public.flower_aliases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.flower_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flower aliases are viewable by everyone"
  ON public.flower_aliases FOR SELECT USING (deleted_at IS NULL);
