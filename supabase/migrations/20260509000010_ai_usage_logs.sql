-- ai_usage_logs: AI 花判定のレート制限ログ
-- - ログイン時: user_id を埋める / 匿名時: anonymous_id（localStorage の UUID）
-- - 匿名 1/日、ログイン 3/日 のカウントに used_at を使う
-- - reward_unlocked: 「しおり生成」などの報酬条件達成フラグ

CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX ai_usage_logs_user_idx
  ON public.ai_usage_logs (user_id, used_at) WHERE deleted_at IS NULL;
CREATE INDEX ai_usage_logs_anon_idx
  ON public.ai_usage_logs (anonymous_id, used_at) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_ai_usage_logs
  BEFORE UPDATE ON public.ai_usage_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
