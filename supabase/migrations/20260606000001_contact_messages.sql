-- contact_messages: お問い合わせフォームの受信箱
-- - 匿名でも送信可（user_id NULL）。ログインユーザーは user_id を埋める
-- - status は new → in_progress → resolved の 3 段階
-- - category は固定リスト（profiles.role 等と同じく TEXT + CHECK IN (...) パターン）
-- - 論理削除（deleted_at）。管理者画面で過去履歴をすべて参照する想定
-- - INSERT は Server Action 経由（Service Role）で行うため public/anon の INSERT ポリシーは置かない

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('INQUIRY', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER')),
  message TEXT NOT NULL,
  reference_url TEXT,
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 一覧の典型クエリ: 受信日時 DESC + 未削除のみ。
-- 管理画面で status 別タブを切る可能性があるため status / created_at の複合 index を貼る。
CREATE INDEX contact_messages_status_created_at_idx
  ON public.contact_messages (status, created_at DESC) WHERE deleted_at IS NULL;
-- レート制限判定（同一 user_id の直近 24h カウント）用。
CREATE INDEX contact_messages_user_created_at_idx
  ON public.contact_messages (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_contact_messages
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- SELECT は管理者のみ。
-- docs/specs/database.md の規約に従い deleted_at フィルタは SELECT ポリシーに含めず
-- アプリ層（lib/queries/contact.ts）で `.is('deleted_at', null)` を付ける。
-- これにより論理削除 UPDATE の RETURNING で「new row violates RLS」が起きない。
CREATE POLICY "Admins can view all contact_messages"
  ON public.contact_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- UPDATE も管理者のみ。USING と WITH CHECK を同一式で明示する
-- （省略時に USING 式が WITH CHECK に流用されるが、規約として明示する）。
CREATE POLICY "Admins can update contact_messages"
  ON public.contact_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- INSERT ポリシーは作らない（Service Role 経由のみ受付）。
-- DELETE ポリシーも作らない（物理削除禁止。deleted_at による論理削除のみ）。
