# 18. 初期データ投入（Python スクレイパー）

## 概要

`data_collector/` 配下に Python スクリプトを5本用意し、観光協会等から花畑スポット情報を収集 → AI 整形 → ジオコーディング → バリデーション → Supabase 投入する。**スクレイピング前に robots.txt を必ず確認する。**

## 依存チケット

- [02](./02_database-schema.md)

## 関連ファイル

```
data_collector/
├── requirements.txt
├── .env
├── config/
│   ├── sources.yaml
│   └── prefecture_map.py
├── scripts/
│   ├── 01_scrape.py
│   ├── 02_normalize.py
│   ├── 03_geocode.py
│   ├── 04_validate.py
│   └── 05_upload.py
└── output/
    ├── raw_data.json
    ├── normalized_data.json
    ├── geocoded_data.json
    └── validated_data.json
```

## TODO

### セットアップ

- [x] `requirements.txt`（requests, beautifulsoup4, pyyaml, tqdm, google-generativeai, googlemaps, supabase, python-dotenv）
- [x] `.env`（GEMINI_API_KEY, GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY）※ `.env.example` をコミットし、`.env` は各自作成
- [x] `config/sources.yaml`（収集対象サイト一覧、selector 定義）※ 雛形のみ。実運用時に差し替える
- [x] `config/prefecture_map.py`（[specs/data-collector.md](./specs/data-collector.md) のマップ）

### 01_scrape.py

- [x] `RobotFileParser` で robots.txt 確認
- [x] User-Agent: `HanaNavBot/1.0 (+...)` を設定
- [x] 各ソースをループしてリスト要素を抽出
- [x] 画像 URL を最大5件取得
- [x] スリープ 2秒以上で礼儀正しく
- [x] `output/raw_data.json` に出力

### 02_normalize.py

- [x] `gemini-2.5-flash` で生データを構造化 JSON に変換
- [x] プロンプトは「不明は null、憶測で埋めない」を明示
- [x] `prefecture_name` → `prefecture_id` に解決（不明はスキップ）
- [x] `output/normalized_data.json` に出力

### 03_geocode.py

- [x] Google Maps Geocoding API で住所 → 緯度経度
- [x] レート対策の sleep
- [x] `output/geocoded_data.json` に出力

### 04_validate.py

- [x] `official_url` の HEAD リクエストで生存確認
- [x] official_url 無しなら source 必須
- [x] 必須項目チェック（name, prefecture_id, location, lat/lng, season, main_flowers）
- [x] `output/validated_data.json` に出力

### 05_upload.py

- [x] `spots` に INSERT（`is_published=False`）
- [x] `images` に INSERT（`display_order` は配列 index、`validateImageOwner` をクライアント側でも呼ぶ）
- [x] `flowers` とマッチング → `spot_flowers` に INSERT
- [x] マッチしなかった花は warning ログ

### 動作確認

- [ ] 5〜10件で end-to-end 動作確認
- [ ] robots.txt 拒否ソースが正しくスキップされる
- [ ] 100件投入 → 管理画面で出典確認 → 公開のフローが回る
- [ ] 200件まで追加投入

### 運用ドキュメント

- [x] README に実行手順を記載
- [ ] 週次バッチの cron / GitHub Actions 例（任意）

## 完了基準

- [ ] 5本のスクリプトが順番に実行できる
- [ ] 公開可能なスポットが 100件以上 DB に入っている

## 参考

- [specs/data-collector.md](./specs/data-collector.md)
- [specs/operations.md](./specs/operations.md) — オーバーツーリズム対策
