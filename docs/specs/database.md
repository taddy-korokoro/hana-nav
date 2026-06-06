# データベース設計

## 共通ルール

- **論理削除**：物理削除は行わない。`deleted_at TIMESTAMPTZ DEFAULT NULL` で管理。有効データは `deleted_at IS NULL` のみ。
- **全クエリで `WHERE deleted_at IS NULL` を必須とする**。
- `updated_at` は共通トリガーで自動更新。
- **RLS の SELECT ポリシーには `deleted_at IS NULL` を入れない**。論理削除（`UPDATE ... SET deleted_at = NOW()`）時に PostgREST の RETURNING が更新後の行を SELECT で取り戻そうとし、SELECT ポリシー条件を満たさず「new row violates row-level security policy」になるため。フィルタは必ずアプリ側 (`.is('deleted_at', null)`) で行う。
- **UPDATE ポリシーには `USING` と同じ式を `WITH CHECK` にも明示する**。省略時の挙動は実環境で揺れがあるため、明示するのを既定ルールとする。
- **本人が直接 UPDATE するテーブルのみ上記 RLS 修正が必要**。具体的には `profiles`（退会・プロフィール編集）、`reviews`（投稿・編集・本人削除）、`bookmarks`（解除）の 3 つだけ。それ以外（`flowers` / `flower_aliases` / `spots` / `spot_flowers` / `images` / `ai_usage_logs`）は admin 画面 / サーバー処理が **Service Role キーで操作する前提**であり、Service Role は RLS をバイパスするので SELECT ポリシーに `deleted_at IS NULL` が残っていても論理削除 UPDATE は成功する。admin 系チケット（15〜17）の実装時には「Service Role を使うこと」を確認すること。authenticated ロールで UPDATE する設計に変えた場合は同じ修正（SELECT から `deleted_at IS NULL` を外す＋UPDATE WITH CHECK 明示）が必須になる。

```sql
-- 共通関数
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## ER図

```
prefectures (47件固定マスター)
   ↑
   │ (FK)
spots ──────────────────────────────────────────────
   │                                                │
   ├──< spot_flowers >── flowers ──< flower_aliases │
   │                        │                       │
   ├──< images (spot用)     ├──< images (flower用)  │
   │                                                │
   ├──< bookmarks >── profiles ────────────────────┘
   │                     │
   ├──< reviews          └──< ai_usage_logs
```

## テーブル定義

### `prefectures`

都道府県マスター。47件固定。アプリからは変更しない。

```sql
CREATE TABLE prefectures (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  display_order SMALLINT NOT NULL
);

INSERT INTO prefectures (id, name, region, display_order) VALUES
  (1, '北海道', '北海道', 1),
  (2, '青森県', '東北', 2),
  (3, '岩手県', '東北', 3),
  (4, '宮城県', '東北', 4),
  (5, '秋田県', '東北', 5),
  (6, '山形県', '東北', 6),
  (7, '福島県', '東北', 7),
  (8, '茨城県', '関東', 8),
  (9, '栃木県', '関東', 9),
  (10, '群馬県', '関東', 10),
  (11, '埼玉県', '関東', 11),
  (12, '千葉県', '関東', 12),
  (13, '東京都', '関東', 13),
  (14, '神奈川県', '関東', 14),
  (15, '新潟県', '中部', 15),
  (16, '富山県', '中部', 16),
  (17, '石川県', '中部', 17),
  (18, '福井県', '中部', 18),
  (19, '山梨県', '中部', 19),
  (20, '長野県', '中部', 20),
  (21, '岐阜県', '中部', 21),
  (22, '静岡県', '中部', 22),
  (23, '愛知県', '中部', 23),
  (24, '三重県', '近畿', 24),
  (25, '滋賀県', '近畿', 25),
  (26, '京都府', '近畿', 26),
  (27, '大阪府', '近畿', 27),
  (28, '兵庫県', '近畿', 28),
  (29, '奈良県', '近畿', 29),
  (30, '和歌山県', '近畿', 30),
  (31, '鳥取県', '中国', 31),
  (32, '島根県', '中国', 32),
  (33, '岡山県', '中国', 33),
  (34, '広島県', '中国', 34),
  (35, '山口県', '中国', 35),
  (36, '徳島県', '四国', 36),
  (37, '香川県', '四国', 37),
  (38, '愛媛県', '四国', 38),
  (39, '高知県', '四国', 39),
  (40, '福岡県', '九州・沖縄', 40),
  (41, '佐賀県', '九州・沖縄', 41),
  (42, '長崎県', '九州・沖縄', 42),
  (43, '熊本県', '九州・沖縄', 43),
  (44, '大分県', '九州・沖縄', 44),
  (45, '宮崎県', '九州・沖縄', 45),
  (46, '鹿児島県', '九州・沖縄', 46),
  (47, '沖縄県', '九州・沖縄', 47);
```

### `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX profiles_role_idx ON profiles (role) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auth signup時に自動でprofiles作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `spots`

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_kana TEXT,
  description TEXT,
  prefecture_id SMALLINT NOT NULL REFERENCES prefectures(id),
  location TEXT NOT NULL,                 -- 住所テキスト（人間が読む用）
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL, -- 緯度経度（地図・距離計算用）
  official_url TEXT,                      -- NULL許可（ない場合はsource必須）
  access_info TEXT,
  parking_info TEXT,
  entrance_fee TEXT,
  best_season_start SMALLINT NOT NULL CHECK (best_season_start BETWEEN 1 AND 12),
  best_season_end SMALLINT NOT NULL CHECK (best_season_end BETWEEN 1 AND 12),
  source TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX spots_coordinates_idx ON spots USING GIST (coordinates);
CREATE INDEX spots_prefecture_idx ON spots (prefecture_id);
CREATE INDEX spots_season_idx ON spots (best_season_start, best_season_end);
CREATE INDEX spots_published_idx ON spots (is_published) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spots
  BEFORE UPDATE ON spots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published spots are viewable by everyone"
  ON spots FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);
```

> **`location` vs `coordinates` の使い分け**
>
> - `location` (TEXT): 人間が読む住所。詳細ページ表示・住所コピー・経路アプリ起動に使う
> - `coordinates` (GEOGRAPHY): 地図上のピン表示・距離計算（PostGIS）に使う

> **月またぎ見頃判定クエリ（例：12〜2月の梅）**
>
> ```sql
> WHERE (best_season_start <= best_season_end
>        AND :current_month BETWEEN best_season_start AND best_season_end)
>    OR (best_season_start > best_season_end
>        AND (:current_month >= best_season_start OR :current_month <= best_season_end))
> ```

`coordinates` は GEOGRAPHY 型のため PostgREST の標準 JSON では扱いづらい。地図表示で lat/lng が必要な場合は **PostgREST computed column** として用意した `spots_latitude(spots) / spots_longitude(spots)` を `select` する：

```typescript
const { data } = await supabase
  .from('spots')
  .select('id, name, latitude:spots_latitude, longitude:spots_longitude')
  .eq('is_published', true)
  .is('deleted_at', null);
```

```sql
CREATE OR REPLACE FUNCTION public.spots_latitude(s public.spots)
RETURNS double precision LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT ST_Y(s.coordinates::geometry)::double precision
$$;

CREATE OR REPLACE FUNCTION public.spots_longitude(s public.spots)
RETURNS double precision LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT ST_X(s.coordinates::geometry)::double precision
$$;
```

### `flowers`

`name` は最も一般的な総称（例：「桜」「チューリップ」）。品種名は `flower_aliases` で管理。

```sql
CREATE TABLE flowers (
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
  BEFORE UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE flowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flowers are viewable by everyone"
  ON flowers FOR SELECT USING (deleted_at IS NULL);
```

### `flower_aliases`

AI判定で返ってくる花名（品種名・表記揺れ）と `flowers.name`（総称）を紐付けるテーブル。

```sql
CREATE TABLE flower_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_id UUID NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (alias)  -- エイリアスは全体でユニーク
);

CREATE INDEX flower_aliases_flower_idx ON flower_aliases (flower_id) WHERE deleted_at IS NULL;
CREATE INDEX flower_aliases_alias_idx ON flower_aliases (alias) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_flower_aliases
  BEFORE UPDATE ON flower_aliases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE flower_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flower aliases are viewable by everyone"
  ON flower_aliases FOR SELECT USING (deleted_at IS NULL);
```

データ例：

```
flowers:   id=A, name='桜'  /  id=B, name='チューリップ'
aliases:   flower_id=A, alias='ソメイヨシノ'
           flower_id=A, alias='ヤマザクラ'
           flower_id=A, alias='シダレザクラ'
           flower_id=B, alias='チューリップ'（カタカナ）
           flower_id=B, alias='鬱金香'（漢字）
```

### `images`（多態関連）

`spots` と `flowers` 両方の画像を一元管理。外部キー制約なし（多態のため）。整合性は2層で保証する。

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('spot', 'flower')),
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX images_owner_idx
  ON images (owner_type, owner_id, display_order)
  WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_images
  BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images are viewable by everyone"
  ON images FOR SELECT USING (deleted_at IS NULL);
```

**整合性の2層防御**

A層（アプリ）：Route Handler内で `validateImageOwner()` ヘルパーを呼び出してからINSERT。

```typescript
// lib/utils/imageValidator.ts
export async function validateImageOwner(
  ownerType: 'spot' | 'flower',
  ownerId: string,
): Promise<boolean> {
  const table = ownerType === 'spot' ? 'spots' : 'flowers';
  const { data } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', ownerId)
    .is('deleted_at', null)
    .maybeSingle();
  return !!data;
}

export async function insertImage(
  ownerType: 'spot' | 'flower',
  ownerId: string,
  url: string,
  displayOrder: number,
) {
  if (!(await validateImageOwner(ownerType, ownerId))) {
    throw new Error(`Invalid owner reference: ${ownerType} ${ownerId}`);
  }
  return supabaseAdmin.from('images').insert({
    owner_type: ownerType,
    owner_id: ownerId,
    url,
    display_order: displayOrder,
  });
}
```

B層（DB）：INSERTトリガーで親レコードの存在を検証。

```sql
CREATE OR REPLACE FUNCTION public.validate_image_owner()
RETURNS TRIGGER AS $$
DECLARE
  exists_count INTEGER;
BEGIN
  IF NEW.owner_type = 'spot' THEN
    SELECT COUNT(*) INTO exists_count FROM spots
    WHERE id = NEW.owner_id AND deleted_at IS NULL;
  ELSIF NEW.owner_type = 'flower' THEN
    SELECT COUNT(*) INTO exists_count FROM flowers
    WHERE id = NEW.owner_id AND deleted_at IS NULL;
  ELSE
    RAISE EXCEPTION 'Invalid owner_type: %', NEW.owner_type;
  END IF;

  IF exists_count = 0 THEN
    RAISE EXCEPTION 'owner_id % does not exist in % table', NEW.owner_id, NEW.owner_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_image_owner_trigger
  BEFORE INSERT OR UPDATE OF owner_type, owner_id ON images
  FOR EACH ROW EXECUTE FUNCTION public.validate_image_owner();
```

親の論理削除時に子をカスケード論理削除するトリガー（spots用・flowers用それぞれ）：

```sql
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_spot_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE images SET deleted_at = NOW()
    WHERE owner_type = 'spot' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_soft_delete_spot_images_trigger
  AFTER UPDATE ON spots
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_spot_images();

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_flower_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE images SET deleted_at = NOW()
    WHERE owner_type = 'flower' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_soft_delete_flower_images_trigger
  AFTER UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_flower_images();
```

**画像取得の実装例**

```typescript
// spots の画像を表示順で取得
const { data: spotImages } = await supabase
  .from('images')
  .select('id, url, caption, display_order')
  .eq('owner_type', 'spot')
  .eq('owner_id', spotId)
  .is('deleted_at', null)
  .order('display_order', { ascending: true });

// スポット詳細と画像を取得（imagesは別クエリ：多態関連のため）
const { data: spot } = await supabase
  .from('spots')
  .select(`*, prefecture:prefectures(id, name, region)`)
  .eq('id', spotId)
  .is('deleted_at', null)
  .single();
```

### `spot_flowers`

スポットと花の中間テーブル。スポット固有の開花月も保持する。

```sql
CREATE TABLE spot_flowers (
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  flower_id UUID NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  bloom_start_month SMALLINT CHECK (bloom_start_month BETWEEN 1 AND 12),
  bloom_end_month SMALLINT CHECK (bloom_end_month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  PRIMARY KEY (spot_id, flower_id)
);

CREATE INDEX spot_flowers_flower_idx ON spot_flowers (flower_id) WHERE deleted_at IS NULL;
CREATE INDEX spot_flowers_bloom_idx ON spot_flowers (bloom_start_month, bloom_end_month) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spot_flowers
  BEFORE UPDATE ON spot_flowers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE spot_flowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Spot-flowers are viewable by everyone"
  ON spot_flowers FOR SELECT USING (deleted_at IS NULL);
```

**見頃情報の3層構造**

| カラム                       | 粒度                                       | 用途                               |
| ---------------------------- | ------------------------------------------ | ---------------------------------- |
| `flowers.default_season_*`   | 花全体の一般的な開花時期                   | フォールバック（NULLの場合に表示） |
| `spot_flowers.bloom_*_month` | スポット固有のその花の開花時期（最も正確） | スポット詳細・絞り込み             |
| `spots.best_season_*`        | スポット全体の見頃ピーク                   | 一覧検索の主フィルタ               |

`spot_flowers.bloom_*_month` が NULL の場合は `flowers.default_season_*` をフォールバック表示する。

```typescript
// lib/utils/seasonUtils.ts
export function isInBestSeason(start: number, end: number, currentMonth: number): boolean {
  if (start <= end) {
    return currentMonth >= start && currentMonth <= end;
  } else {
    // 月またぎ（例: 12〜2月）
    return currentMonth >= start || currentMonth <= end;
  }
}
```

### `bookmarks`

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (user_id, spot_id)
);

CREATE INDEX bookmarks_user_idx ON bookmarks (user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_bookmarks
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシーに deleted_at IS NULL を入れない（共通ルール参照）。
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### `reviews`

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (LENGTH(comment) <= 200),
  visited_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (user_id, spot_id)  -- 1ユーザー1スポット1レビュー
);

CREATE INDEX reviews_spot_idx ON reviews (spot_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE USING (auth.uid() = user_id);
```

レビューのNGワードフィルタ：辞書ベースで `lib/ng-words.ts` に配置（バージョン管理）。簡単な部分一致のみ（リアルタイム性能優先）。すり抜けたものは管理者が手動で論理削除。

退会ユーザーのレビューは「退会済ユーザー」表示で残す方針。`profiles.deleted_at IS NOT NULL` の場合に username の代わりに「退会済ユーザー」を表示する。

### `ai_usage_logs`

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULLの場合は匿名
  anonymous_id TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX ai_usage_logs_user_idx ON ai_usage_logs (user_id, used_at) WHERE deleted_at IS NULL;
CREATE INDEX ai_usage_logs_anon_idx ON ai_usage_logs (anonymous_id, used_at) WHERE deleted_at IS NULL;

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
```

### `contact_messages`

`/contact` フォームから送信されたお問い合わせの受信箱。匿名ユーザーも送信可能（`user_id NULL`）。管理画面（`/admin/contact`）でのみ閲覧・status 切替・論理削除を行う。INSERT は Server Action から Service Role 経由で行うため、public/anon の INSERT ポリシーは置かない。

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- 匿名は NULL
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

CREATE INDEX contact_messages_status_created_at_idx
  ON contact_messages (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX contact_messages_user_created_at_idx
  ON contact_messages (user_id, created_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
-- 管理者のみ SELECT / UPDATE 可能。deleted_at フィルタは SELECT に含めず、アプリ層で .is('deleted_at', null)。
CREATE POLICY "Admins can view all contact_messages"
  ON contact_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
  );
CREATE POLICY "Admins can update contact_messages"
  ON contact_messages FOR UPDATE
  USING (...同上)
  WITH CHECK (...同上);
```

レート制限はテーブル自身に COUNT を投げて判定（直近 24 時間で `user_id` または `email` ベースに最大 3 件）。spam 対策は honeypot フィールド + NG ワード（`lib/ng-words.ts`）でカバーする。
