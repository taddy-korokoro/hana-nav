-- flowers テーブルに栽培属性カラムを追加
-- - 値は固定リスト。プロジェクト規約に揃え TEXT + CHECK IN (...) で enum 相当に制約する
--   （profiles.role / images.owner_type と同じパターン。CREATE TYPE ENUM は使わない：
--    後方互換のある値追加・削除・リネームが CHECK の方が容易なため）
-- - 既存行は NULL で初期化される。CHECK は NULL を UNKNOWN として許容するため違反にならない
-- - 格納値は SCREAMING_SNAKE_CASE の英語識別子。表示時の日本語ラベルはアプリ側で持つ
--   （言語非依存・表記揺れの吸収・将来の多言語対応のため）
--
--   表示マッピング:
--     cultivation_difficulty: EASY=易しい／SLIGHTLY_EASY=やや易しい／NORMAL=普通／SLIGHTLY_HARD=やや難しい／HARD=難しい
--     cold_tolerance / heat_tolerance: STRONG=強い／SLIGHTLY_STRONG=やや強い／NORMAL=普通／SLIGHTLY_WEAK=やや弱い／WEAK=弱い
--     shade_tolerance: AVAILABLE=あり／UNAVAILABLE=なし

ALTER TABLE public.flowers
  ADD COLUMN cultivation_difficulty TEXT
    CHECK (cultivation_difficulty IN ('EASY', 'SLIGHTLY_EASY', 'NORMAL', 'SLIGHTLY_HARD', 'HARD')),
  ADD COLUMN cold_tolerance TEXT
    CHECK (cold_tolerance IN ('STRONG', 'SLIGHTLY_STRONG', 'NORMAL', 'SLIGHTLY_WEAK', 'WEAK')),
  ADD COLUMN heat_tolerance TEXT
    CHECK (heat_tolerance IN ('STRONG', 'SLIGHTLY_STRONG', 'NORMAL', 'SLIGHTLY_WEAK', 'WEAK')),
  ADD COLUMN shade_tolerance TEXT
    CHECK (shade_tolerance IN ('AVAILABLE', 'UNAVAILABLE'));

COMMENT ON COLUMN public.flowers.cultivation_difficulty
  IS '栽培難易度: EASY(易しい)／SLIGHTLY_EASY(やや易しい)／NORMAL(普通)／SLIGHTLY_HARD(やや難しい)／HARD(難しい)';
COMMENT ON COLUMN public.flowers.cold_tolerance
  IS '耐寒性: STRONG(強い)／SLIGHTLY_STRONG(やや強い)／NORMAL(普通)／SLIGHTLY_WEAK(やや弱い)／WEAK(弱い)';
COMMENT ON COLUMN public.flowers.heat_tolerance
  IS '耐暑性: STRONG(強い)／SLIGHTLY_STRONG(やや強い)／NORMAL(普通)／SLIGHTLY_WEAK(やや弱い)／WEAK(弱い)';
COMMENT ON COLUMN public.flowers.shade_tolerance
  IS '耐陰性: AVAILABLE(あり)／UNAVAILABLE(なし)';
