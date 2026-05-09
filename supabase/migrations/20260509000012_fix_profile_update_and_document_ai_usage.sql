-- PR #10 レビュー指摘の修正（profiles UPDATE 脆弱性 + ai_usage_logs 設計意図の明示）
-- ----------------------------------------------------------------------------
-- 1. profiles UPDATE ポリシーの権限昇格バグを修正
--    `USING (auth.uid() = id)` 単独だと PostgreSQL は USING 式を新行検証にも
--    流用するため、`id` は固定だが `role` など他カラムは無制限に更新可能。
--    ログイン済みユーザーが `role = 'admin'` に自己昇格できる脆弱性。
--    WITH CHECK で「更新後の role が更新前と同一」を強制してブロックする。
--    管理者によるロール付与は SERVICE_ROLE_KEY 経由（RLS バイパス）で続行。
--
-- 2. ai_usage_logs は SELECT ポリシーのみで INSERT/UPDATE が拒否される。
--    Route Handler の SERVICE_ROLE_KEY 経由でのみ書く設計を COMMENT で明示。
-- ----------------------------------------------------------------------------

ALTER POLICY "Users can update own profile" ON public.profiles
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE public.ai_usage_logs IS
  'AI 花判定のレート制限ログ。INSERT / UPDATE は Route Handler の SERVICE_ROLE_KEY 経由のみで行う設計（RLS バイパス）。anon / authenticated は SELECT 権限のみ持つ。';
