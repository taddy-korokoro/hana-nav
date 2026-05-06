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

- [ ] `requirements.txt`（requests, beautifulsoup4, pyyaml, tqdm, google-generativeai, googlemaps, supabase, python-dotenv）
- [ ] `.env`（GEMINI_API_KEY, GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY）
- [ ] `config/sources.yaml`（収集対象サイト一覧、selector 定義）
- [ ] `config/prefecture_map.py`（CLAUDE.md 11 章のマップ）

### 01_scrape.py

- [ ] `RobotFileParser` で robots.txt 確認
- [ ] User-Agent: `HanaNavBot/1.0 (+...)` を設定
- [ ] 各ソースをループしてリスト要素を抽出
- [ ] 画像 URL を最大5件取得
- [ ] スリープ 2秒以上で礼儀正しく
- [ ] `output/raw_data.json` に出力

### 02_normalize.py

- [ ] `gemini-2.5-flash` で生データを構造化 JSON に変換
- [ ] プロンプトは「不明は null、憶測で埋めない」を明示
- [ ] `prefecture_name` → `prefecture_id` に解決（不明はスキップ）
- [ ] `output/normalized_data.json` に出力

### 03_geocode.py

- [ ] Google Maps Geocoding API で住所 → 緯度経度
- [ ] レート対策の sleep
- [ ] `output/geocoded_data.json` に出力

### 04_validate.py

- [ ] `official_url` の HEAD リクエストで生存確認
- [ ] official_url 無しなら source 必須
- [ ] 必須項目チェック（name, prefecture_id, location, lat/lng, season, main_flowers）
- [ ] `output/validated_data.json` に出力

### 05_upload.py

- [ ] `spots` に INSERT（`is_published=False`）
- [ ] `images` に INSERT（`display_order` は配列 index、`validateImageOwner` をクライアント側でも呼ぶ）
- [ ] `flowers` とマッチング → `spot_flowers` に INSERT
- [ ] マッチしなかった花は warning ログ

### 動作確認

- [ ] 5〜10件で end-to-end 動作確認
- [ ] robots.txt 拒否ソースが正しくスキップされる
- [ ] 100件投入 → 管理画面で出典確認 → 公開のフローが回る
- [ ] 200件まで追加投入

### 運用ドキュメント

- [ ] README に実行手順を記載
- [ ] 週次バッチの cron / GitHub Actions 例（任意）

## 完了基準

- [ ] 5本のスクリプトが順番に実行できる
- [ ] 公開可能なスポットが 100件以上 DB に入っている

## 参考

- CLAUDE.md「11. 初期データ投入（Python）」
- CLAUDE.md「13. オーバーツーリズム対策」
