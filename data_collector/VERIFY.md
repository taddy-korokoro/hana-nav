# data_collector 動作確認手順

`docs/18_data-collector.md` の「動作確認」を潰すためのランブック。

スモークテスト → 本番投入の順に進める。各 Step の「内部で何が起きるか」「成功判定」「失敗時の見方」をセットで記載。

---

## Step 0: 事前準備

```bash
cd /Users/taddy/development/claude-code/hana-nav/data_collector
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` に以下 4 つを設定：

```
GEMINI_API_KEY=...
GOOGLE_MAPS_API_KEY=...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # プロジェクトルートの .env.local からコピー
```

確認：

```bash
python3 -c "import requests, bs4, yaml, tqdm, googlemaps, supabase, dotenv; from google import genai; print('OK')"
```

`OK` だけ出れば成功（FutureWarning は出ないはず）。

---

## Step 1: スモークテストの 2 ルート

### Option A: ダミーデータで 02 以降を先に通す（推奨）

実サイトの selector 調整は時間がかかるので、まず手書きの `raw_data.json` で 02 以降のパイプラインが通ることを確認する。

```bash
cat > output/raw_data.json <<'EOF'
[
  {
    "raw_name": "ひたち海浜公園",
    "raw_address": "茨城県ひたちなか市馬渡字大沼605-4",
    "raw_description": "ネモフィラとコキアで有名な国営公園。春は青一面、秋は赤一面に染まる。",
    "official_url": "https://hitachikaihin.jp/",
    "image_urls": [],
    "source": "smoke_test",
    "source_url": "https://example.com/smoke"
  },
  {
    "raw_name": "昭和記念公園",
    "raw_address": "東京都立川市緑町3173",
    "raw_description": "チューリップ、コスモス、ひまわりなど四季折々の花が楽しめる国営公園。",
    "official_url": "https://www.showakinen-koen.jp/",
    "image_urls": [],
    "source": "smoke_test",
    "source_url": "https://example.com/smoke"
  }
]
EOF
```

→ そのまま Step 3 へ。

### Option B: 実サイトでスクレイピングから動かす

`config/sources.yaml` を実在サイトに書き換えてから Step 2 へ。selector はブラウザ DevTools の「Copy selector」が最速。

### Option C: hanamap.com 専用スクレイパで動かす

hanamap.com は 3 階層構造（エリア→都道府県→詳細）で住所欄が無いため、専用スクレイパと Places API フォールバックを使う。

```bash
# 1) Places API を有効化する（GCP Console、Geocoding API と同じ手順）
#    Console > APIs & Services > Library > "Places API" > ENABLE
#    API キー制限がある場合は Places API を許可リストに追加

# 2) config/hanamap.yaml を確認（デフォルトは hokkaido のみ 10 件）

# 3) 専用スクレイパを実行
python scripts/01_scrape_hanamap.py
```

3 段スクレイパが内部で行うこと:
1. `/flower/area/` または config の `target_prefecture_paths` から都道府県パスを決定
2. 各都道府県ページを `/page/2/`, `/page/3/` ... と巡回して entry-N.html リンクを収集
3. 各 entry-N.html から名称・ふりがな・都道府県・花タグ・説明・公式URL・画像を抽出
4. 住所欄は無いので `raw_address: null` のまま出力（03 が Places API で解決）

成功判定:

```bash
jq 'length' output/raw_data.json
jq '.[0] | {raw_name, prefecture_hint, flower_tags, image_urls: (.image_urls | length), official_url}' output/raw_data.json
```

`prefecture_hint` が「北海道」など日本語で入っていれば OK。続けて Step 3 へ進む。03 の挙動が Geocoding API → Places API のフォールバック動作になることを確認すること。

---

## Step 2: 01_scrape.py（Option B のみ）

```bash
python scripts/01_scrape.py
```

**内部で起きること:**

1. `config/sources.yaml` を読み込んでループ
2. 各 URL の robots.txt を取得（`RobotFileParser`）
3. HanaNavBot に対して許可されていなければ `skipped (robots.txt)` を出してスキップ
4. 許可されていれば 2 秒スリープしてから `User-Agent: HanaNavBot/1.0` で GET
5. `BeautifulSoup` で `item_selector` を全要素ループし、name / address / description / `<a href>` / `<img src>`（最大 5 件）を抽出
6. `output/raw_data.json` に追記

**成功判定:**

```bash
jq 'length' output/raw_data.json                              # 件数
jq '.[0]' output/raw_data.json                                # 最初のレコード構造
jq '[.[] | select(.raw_name == null)] | length' output/raw_data.json  # 0 のはず
```

**失敗時:**
- `length == 0`: selector が当たっていない。`item_selector` を再確認
- `image_urls` が空ばかり: 対象サイトが `<img loading="lazy" data-src=...>` を使っている → `_collect_image_urls` で `data-src` も拾うよう拡張
- `skipped (robots.txt)`: 設計通り。別ソースを試す

**robots.txt 拒否テスト:** `sources.yaml` に `https://www.google.com/search?q=hana` のような拒否サイトを混ぜ、再実行して `skipped (robots.txt)` が出ることを確認。

---

## Step 3: 02_normalize.py（Gemini で構造化）

```bash
python scripts/02_normalize.py
```

**内部で起きること:**

1. `output/raw_data.json` を 1 件ずつ Gemini 2.5 Flash に投入
2. プロンプトは「JSON のみ、不明は null」を明示
3. `response_mime_type="application/json"` で JSON モード強制（フェンスなし）
4. `json.loads()` でパース、失敗したら `warn: JSON パース失敗` でその件をスキップ
5. `prefecture_name` を `to_prefecture_id` でマップ：完全一致 → 部分一致 → 解決不可なら `warn: 都道府県不明` でスキップ
6. raw 由来の `official_url` / `image_urls` / `source` / `source_url` を引き継ぐ
7. `output/normalized_data.json` に出力

**成功判定:**

```bash
jq 'length' output/normalized_data.json
jq '.[0]' output/normalized_data.json
jq '.[] | {name, prefecture_id, best_season_start, best_season_end, main_flowers}' output/normalized_data.json
```

`prefecture_id` が 1-47、`main_flowers` が配列、`best_season_*` が 1-12 か確認。

**失敗時:**
- 標準エラーの `warn:` メッセージで切り分け
- `prefecture_id` が欠落: `config/prefecture_map.py` のマップ未整備
- Gemini レスポンスを生で見たい場合は `response.text` の直後に `print` を仕込む

**コスト目安:** 1 件あたり ~500 入力 + ~300 出力 tokens なので、2 件で約 $0.001 未満。

---

## Step 4: 03_geocode.py（住所 → 緯度経度）

```bash
python scripts/03_geocode.py
```

**内部で起きること（2 段フォールバック）:**

1. `output/normalized_data.json` を 1 件ずつ処理
2. **住所がある場合:** `prefecture_name + location` で組み立てた住所を Geocoding API に投入（`region="jp"`）
3. **住所が無い or Geocoding が失敗した場合:** Places API "Find Place from Text" で `prefecture + name` から候補検索 → `formatted_address` を `item["location"]` に書き戻し、座標も取得（hanamap 等の住所欠落ソース向け）
4. 0.1 秒スリープ（QPS 制限対策）
5. どちらも失敗したアイテムは座標が付かないまま流れる（04 で弾く）
6. `output/geocoded_data.json` に出力

**成功判定:**

```bash
jq '.[] | {name, location, latitude, longitude}' output/geocoded_data.json
# ひたち海浜公園: lat=36.4 lng=140.6 付近 / 昭和記念公園: lat=35.7 lng=139.4 付近
# hanamap ソース: location が Places API から書き戻されている（例: "日本、〒...北海道..."）
```

**失敗時:**
- `geocode 失敗` / `find_place 失敗`: 標準エラーの stderr メッセージで原因切り分け
- `geocode 結果なし`: 住所表記が曖昧 → 02 のプロンプトで「市区町村+番地まで」を出させる
- `find_place 結果なし`: マイナースポットで Places のヒットが弱い → スポット名の前置を工夫
- 429: クォータ超過 → `SLEEP_BETWEEN_REQUESTS_SEC` を 0.2-0.5 に上げる
- `REQUEST_DENIED`: GCP Console で **Geocoding API / Places API が有効化されていない**

**コスト目安:** Geocoding $5 / 1000 req、Places "Find Place" $17 / 1000 req。月 $200 無料枠。100 件で計 $1-2 程度。

---

## Step 5: 04_validate.py（生存確認と必須項目チェック）

```bash
python scripts/04_validate.py
```

**内部で起きること:**

1. `official_url` があれば HEAD リクエスト（timeout 5 秒、redirect 追跡）
2. ステータス 400 以上ならクリア（`official_url = null`）
3. `official_url` も `source` も無いアイテムは捨てる（出典が辿れない）
4. 必須項目（`name`, `prefecture_id`, `location`, `latitude`, `longitude`, `best_season_start`, `best_season_end`, `main_flowers`）が揃っているかチェック
5. 通ったアイテムだけ `output/validated_data.json` に出力

**成功判定:**

```bash
jq 'length' output/validated_data.json
# 標準エラーに valid N/M
```

**失敗時:**
- 件数が大幅に減る: `validate()` に print を仕込んで切り分け
- 全件 `official_url` が null: HEAD が通っていない。`requests.head` を `get(stream=True)` に置き換えて回避

---

## Step 6: 05_upload.py（Supabase 投入）

**ここから DB にデータが入る。必ず開発環境で実行する。**

```bash
python scripts/05_upload.py
```

**内部で起きること:**

1. `SERVICE_ROLE_KEY` で Supabase クライアント初期化（RLS バイパス）
2. 各アイテムについて:
   - **spots**: `is_published=false` で INSERT。`coordinates` は `POINT(lng lat)` 形式（経度 → 緯度の順、間違えると地球の裏側に飛ぶ）
   - **images**: INSERT 前に `_validate_spot_exists` で親 spot を確認（A 層）。OK なら `display_order=0,1,2...` で一括 INSERT。DB トリガー `validate_image_owner_trigger` が B 層
   - **spot_flowers**: 各花名について `flowers.name` 一致 → `flower_aliases.alias` 一致 の順で解決。両方ミスなら `warn: flowers 未マッチ` でスキップ。OK なら INSERT
3. 1 件失敗しても全停止しない（`error: upload 失敗` を出して次へ）

**成功判定（Supabase Dashboard or psql）:**

```sql
-- 1. spots（is_published=false で入っているか）
SELECT id, name, prefecture_id, is_published, source, official_url, created_at
FROM spots
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- 2. images（display_order が 0,1,... の昇順）
SELECT owner_id, display_order, url
FROM images
WHERE owner_type = 'spot'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY owner_id, display_order;

-- 3. spot_flowers
SELECT s.name AS spot_name, f.name AS flower_name, sf.bloom_start_month, sf.bloom_end_month
FROM spot_flowers sf
JOIN spots s ON s.id = sf.spot_id
JOIN flowers f ON f.id = sf.flower_id
WHERE sf.created_at > NOW() - INTERVAL '10 minutes';
```

**チェックポイント:**
- `is_published=false` で入っている（true なら絶対 NG、コード見直し）
- `images.display_order` が 0,1,2... の連番
- `spot_flowers` 件数 + warning 件数 = 投入アイテムの `main_flowers` 合計数
- `validate_image_owner_trigger` 系のエラーが出ていない

**失敗時:**
- `invalid input syntax for type uuid`: `_validate_spot_exists` の判定ログを確認
- `null value in column "X"`: NOT NULL カラムが NULL（04 のバリデーション漏れ）
- `new row violates row-level security policy`: Service Role キーが正しく渡っていない

---

## Step 7: 管理画面で出典確認 → 公開

別ターミナルで Next.js を起動:

```bash
cd /Users/taddy/development/claude-code/hana-nav
npm run dev
```

ブラウザで:

1. `http://localhost:3000/admin/spots/pending` を開く
   - 投入したスポットが「未公開」一覧に表示される
   - 表示されない: ログインユーザーが `profiles.role='admin'` か確認
2. 1 件をクリックして詳細確認
   - `name`, `location`, `official_url`, `source`, `description` が DB の通り
   - 地図ピンが正しい位置（経度・緯度入れ違いなら遠くに飛ぶ）
3. 公開ボタンで `is_published=true` に
4. `http://localhost:3000/spots` で検索結果に出る
5. スポット詳細ページで花一覧（spot_flowers 経由）が表示される

---

## Step 8: クリーンアップ

スモークテストデータは論理削除（**物理削除禁止**、CLAUDE.md 規約）:

```sql
UPDATE spots
SET deleted_at = NOW()
WHERE source = 'smoke_test'
  AND deleted_at IS NULL;
-- 子テーブル（images, spot_flowers）は cascade_soft_delete_spot_images_trigger で自動論理削除
```

確認:

```sql
SELECT name, deleted_at FROM spots WHERE source = 'smoke_test';
-- deleted_at が全件 NOT NULL

SELECT COUNT(*) FROM images
WHERE owner_id IN (SELECT id FROM spots WHERE source = 'smoke_test')
  AND deleted_at IS NULL;
-- 0 のはず（cascade されている）
```

---

## Step 9: 本番投入（100 → 200 件）

スモークが通ったら:

1. `output/*.json` を退避: `mv output output.smoke && mkdir output && touch output/.gitkeep`
2. `config/sources.yaml` に本番ソース 5〜10 件を追記
3. Option B の手順（01→02→03→04→05）で本番データを通す
4. 100 件入ったら管理画面で 1 件ずつレビュー → `is_published=true`
5. 一週間後を目安に再度回して 200 件まで増やす

---

## 早見表

| Step | コマンド | 出力 | 主な確認 |
|---|---|---|---|
| 0 | venv 作成 + pip install | – | import OK |
| 1A | heredoc でダミー作成 | `output/raw_data.json` | jq で件数 |
| 1B | `sources.yaml` 編集 | – | – |
| 2 | `python scripts/01_scrape.py` | `output/raw_data.json` | robots.txt スキップログ |
| 3 | `python scripts/02_normalize.py` | `output/normalized_data.json` | `prefecture_id` 1-47 |
| 4 | `python scripts/03_geocode.py` | `output/geocoded_data.json` | `latitude/longitude` 数値 |
| 5 | `python scripts/04_validate.py` | `output/validated_data.json` | `valid N/M` ログ |
| 6 | `python scripts/05_upload.py` | Supabase | `is_published=false` で入る |
| 7 | `npm run dev` + 管理画面 | – | 出典確認 → 公開 |
| 8 | UPDATE SQL | – | `deleted_at` セット |
| 9 | 本番ソースに切替えて再実行 | – | 100 件公開 |

最短ルートは **Option A（ダミー）で Step 3 から Supabase 投入まで通す**。Option A が通ってから Option B のスクレイピング部分に着手すると原因の切り分けが楽。
