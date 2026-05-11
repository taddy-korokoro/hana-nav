-- reviews UPDATE ポリシーに `WITH CHECK` を明示する。
--
-- 背景: 共通ルール（docs/specs/database.md）では「UPDATE ポリシーには `USING` と同じ式を
--       `WITH CHECK` にも明示する」。省略時に PostgreSQL は USING 式を新行検証に流用するため、
--       `user_id` を他人の ID へ書き換える行更新を防ぐためにも WITH CHECK が必要。
--       本人が直接 UPDATE するテーブル（profiles / reviews / bookmarks）のうち、profiles は
--       既に修正済み（20260509000012）、reviews は本マイグレーションで修正する。bookmarks は
--       同じ修正が必要だが別チケットで扱う。
--
-- 影響範囲: アプリ側のクエリは `auth.uid() = user_id` を前提に書かれているため挙動は変わらない。

ALTER POLICY "Users can update own reviews" ON public.reviews
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
