-- flowers.name_kana: 50 音ソート / 50 音インデックス（あ行・か行 …）用の読み仮名カラム。
-- `name` は漢字・カタカナ混在のため、文字列ソートでは 50 音順にならない。
-- /flowers 一覧の表示順とインデックスジャンプを揃えるため、ひらがなの読みを保持する。
--
-- - 既存データには別途 seed.sql（または手動 UPDATE）で埋める。
-- - NULL 許可（curate 漏れがあっても挿入を止めないため）。NULL は表示時に末尾へ送る。
-- - 並び替え専用なので CHECK や UNIQUE は付けない。

ALTER TABLE public.flowers
  ADD COLUMN IF NOT EXISTS name_kana TEXT;

-- 50 音ソート用インデックス。`ORDER BY name_kana NULLS LAST, name` のクエリで効く。
CREATE INDEX IF NOT EXISTS flowers_name_kana_idx
  ON public.flowers (name_kana)
  WHERE deleted_at IS NULL;
