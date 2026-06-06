-- contact_replies の INSERT ポリシーを追加。
--
-- 当初マイグレーション（20260606000002）では SELECT ポリシーのみ作っており、
-- ユーザーコンテキストの Supabase クライアントで INSERT すると
-- `new row violates row-level security policy for table "contact_replies"`
-- で弾かれていた。
--
-- contact_messages とは違って INSERT 元は admin ロールのユーザーなので、
-- Service Role でバイパスするのではなく素直に RLS ポリシーで通す形にする。
-- 認可条件は SELECT ポリシーと同じ「admin かつ profiles 未論理削除」。

CREATE POLICY "Admins can insert contact_replies"
  ON public.contact_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );
