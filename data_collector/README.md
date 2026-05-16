# data_collector

観光協会等のサイトから花畑スポット情報を収集し、Supabase に投入する Python スクリプト群。

詳細仕様は [`docs/specs/data-collector.md`](../docs/specs/data-collector.md) と [`docs/18_data-collector.md`](../docs/18_data-collector.md) を参照。

## 構成

```
data_collector/
├── requirements.txt
├── .env.example
├── config/
│   ├── sources.yaml      # 収集対象サイト一覧
│   └── prefecture_map.py # 都道府県名 → prefecture_id
├── scripts/
│   ├── 01_scrape.py      # robots.txt 確認 + スクレイピング
│   ├── 02_normalize.py   # Gemini で構造化 JSON 化
│   ├── 03_geocode.py     # 住所 → 緯度経度
│   ├── 04_validate.py    # URL 生存確認 + 必須項目チェック
│   └── 05_upload.py      # Supabase へ投入（is_published=false）
└── output/               # 各工程の中間 JSON が出力される（git 管理外）
```

## セットアップ

```bash
cd data_collector
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env を編集して API キーを設定
```

必要な環境変数:

| 変数                        | 用途                        |
| --------------------------- | --------------------------- |
| `GEMINI_API_KEY`            | 02_normalize.py で利用      |
| `GOOGLE_MAPS_API_KEY`       | 03_geocode.py で利用        |
| `SUPABASE_URL`              | 05_upload.py で利用         |
| `SUPABASE_SERVICE_ROLE_KEY` | 05_upload.py で利用（秘匿） |

`SUPABASE_SERVICE_ROLE_KEY` は RLS をバイパスする。`.env` をコミットしないこと。

### GCP 側で有効化が必要な API

`GOOGLE_MAPS_API_KEY` を取得しただけでは Geocoding は動かない。**GCP Console で対象プロジェクトを開き、以下を有効化する**:

- **Geocoding API**（03_geocode.py の住所→座標解決で必須）
- **Places API**（03_geocode.py の名称→住所/座標フォールバックで必須。hanamap など住所欠落ソース向け）
- **Maps JavaScript API**（地図表示で利用、本体アプリで使用）
- **Billing** を有効化（Geocoding $5 / 1000 requests、Places "Find Place" $17 / 1000 requests、月 $200 無料枠あり）
- API キーに制限がかかっている場合は「API restrictions」に Geocoding API / Places API を追加

未有効化のまま 03 を実行すると、`gmaps.geocode` が空配列を返してサイレントに失敗するため、必ず先に有効化する。疎通確認は次のコマンドで:

```bash
python scripts/check_geocode.py
```

`REQUEST_DENIED` などの ERR が出たら未有効化 or キー制限を疑う。

## 実行手順

スクレイパは 2 系統あるのでソースに応じて 01 を使い分ける（02 以降は共通）:

### A. 汎用スクレイパ（一覧ページ型のサイト）

`config/sources.yaml` を実在ソースの selector に書き換えてから:

```bash
cd data_collector
source .venv/bin/activate

python scripts/01_scrape.py        # output/raw_data.json（汎用 1 段スクレイパ）
python scripts/02_normalize.py     # output/normalized_data.json
python scripts/03_geocode.py       # output/geocoded_data.json
python scripts/04_validate.py      # output/validated_data.json
python scripts/05_upload.py        # Supabase に INSERT
```

### B. hanamap.com 専用スクレイパ（3 段：エリア→都道府県→詳細）

`config/hanamap.yaml` で対象都道府県と件数を調整してから:

```bash
python scripts/01_scrape_hanamap.py  # output/raw_data.json（hanamap 専用 3 段スクレイパ）
python scripts/02_normalize.py       # 以下 A と同じ
python scripts/03_geocode.py         # location 欠落でも Places API で解決
python scripts/04_validate.py
python scripts/05_upload.py
```

hanamap には住所欄が無いため、03 が **Places API "Find Place from Text"** で `prefecture + name` から住所/座標を解決する。事前に **GCP で Places API を有効化** すること。

投入直後は `spots.is_published=false`。管理画面（[`/admin/spots/pending`](../docs/15_admin-spots.md)）で出典・説明文を確認し、問題なければ `is_published=true` で公開する。

## 動作確認の進め方

1. `config/sources.yaml` を 1 ソースだけにし、5〜10 件で end-to-end が回ることを確認
2. robots.txt 拒否のソースを混ぜて、`skipped (robots.txt)` ログが出ることを確認
3. 100 件投入 → 管理画面で出典確認 → 公開のフローを確認
4. 問題なければ追加投入

## 注意

- スクレイピング前に **robots.txt を必ず確認する**（01 で自動チェック）。読めない場合は安全側で拒否する
- User-Agent は `HanaNavBot/1.0 (+https://hananav.example.com/bot)`。リクエスト間に 2 秒以上のスリープを入れる
- 画像は 1 件あたり最大 5 件まで（`display_order` は配列インデックス）
- `flowers` / `flower_aliases` に存在しない花名は spot_flowers に紐付かない。warning ログを見て随時マスター追加すること
- 週次バッチ運用する場合は GitHub Actions or cron で `01 → 02 → 03 → 04 → 05` を順に実行する

## トラブルシュート

| 症状                                                | 対処                                                                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 02 で `JSON パース失敗` が頻発                      | `response_mime_type=application/json` で JSON モードを強制中。モデル更新で壊れたらプロンプトと `_strip_code_fence` を要確認 |
| 03 で `geocode 失敗`                                | 住所表記が曖昧。02 でより詳細な住所を出すようプロンプト調整                                                                 |
| 05 で `flowers 未マッチ` ログ                       | `flowers` / `flower_aliases` テーブルに該当花がない。管理画面から追加                                                       |
| 05 で `invalid input syntax for type uuid` 等エラー | DB トリガー違反（親 spot 不在など）。`_validate_spot_exists` の結果を確認                                                   |
