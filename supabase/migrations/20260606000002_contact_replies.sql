-- contact_replies: contact_messages への管理者からの返信履歴
-- - 1 つの問い合わせに複数回返信できる前提（FAQ 的なやり取りも想定）
-- - sent_at は SMTP 経由で送信が成功したタイミングを保持
-- - admin_id は監査用。auth.users 削除時は履歴自体は残したいので SET NULL
-- - 物理削除は禁止。論理削除（deleted_at）のみ

CREATE TABLE public.contact_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 詳細画面で「この問い合わせへの返信を新しい順に」表示する典型クエリ用。
CREATE INDEX contact_replies_message_idx
  ON public.contact_replies (contact_message_id, sent_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE public.contact_replies ENABLE ROW LEVEL SECURITY;

-- SELECT は管理者のみ。
-- 規約に従い deleted_at は SELECT ポリシーに含めず、アプリ層で .is('deleted_at', null) を付ける。
CREATE POLICY "Admins can view all contact_replies"
  ON public.contact_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );

-- INSERT / UPDATE / DELETE は Service Role 経由（Server Action）のみ。
-- ゲスト管理者は requireWriteAdmin() で UI 層・サーバ層の両方で弾く。
