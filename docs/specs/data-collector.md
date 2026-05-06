# 初期データ投入（Python）


`data_collector/` 以下のスクリプトで観光協会等からスクレイピング→AI整形→ジオコーディング→バリデーション→Supabase投入。**スクレイピング前に `robots.txt` を必ず確認すること。**

実行順：`01_scrape.py` → `02_normalize.py` → `03_geocode.py` → `04_validate.py` → `05_upload.py`

投入後は `is_published=false`。管理者がSupabaseのDashboardまたは管理画面で内容を確認してから `is_published=true` で公開する。

### データソース候補

| ソース | robots.txt | 信頼性 | 備考 |
|---|---|---|---|
| 全国花畑ガイドサイト | 確認必須 | 中 | スクレイピング対象の主力 |
| 都道府県観光協会公式サイト | 低リスク | 高 | 公式情報のため信頼性が高い |
| 国営公園公式サイト | 低リスク | 高 | 17箇所（管理された公開情報） |
| 自治体オープンデータ | 高（CC） | 高 | CSV/JSON配布あり、ライセンス確認必須 |
| Wikipedia（花名所カテゴリ） | 低リスク | 中 | CC BY-SAで利用可 |

### 週次バッチ運用フロー

```
[週1回バッチ実行]
  01_scrape.py
    ↓
  02_normalize.py（Geminiで構造化）
    ↓
  03_geocode.py（住所→緯度経度）
    ↓
  04_validate.py（URL生存確認・必須項目チェック）
    ↓
  05_upload.py（Supabaseへ投入、is_published=false）
    ↓
[管理者レビュー（/admin/spots/pending）]
  スポット情報・出典を確認
  説明文の不適切表現チェック
    ↓
[is_published=true で公開]
```

### `config/prefecture_map.py`

```python
PREFECTURE_MAP = {
    "北海道": 1, "青森県": 2, "岩手県": 3, "宮城県": 4, "秋田県": 5,
    "山形県": 6, "福島県": 7, "茨城県": 8, "栃木県": 9, "群馬県": 10,
    "埼玉県": 11, "千葉県": 12, "東京都": 13, "神奈川県": 14, "新潟県": 15,
    "富山県": 16, "石川県": 17, "福井県": 18, "山梨県": 19, "長野県": 20,
    "岐阜県": 21, "静岡県": 22, "愛知県": 23, "三重県": 24, "滋賀県": 25,
    "京都府": 26, "大阪府": 27, "兵庫県": 28, "奈良県": 29, "和歌山県": 30,
    "鳥取県": 31, "島根県": 32, "岡山県": 33, "広島県": 34, "山口県": 35,
    "徳島県": 36, "香川県": 37, "愛媛県": 38, "高知県": 39, "福岡県": 40,
    "佐賀県": 41, "長崎県": 42, "熊本県": 43, "大分県": 44, "宮崎県": 45,
    "鹿児島県": 46, "沖縄県": 47,
}

def to_prefecture_id(name: str) -> int | None:
    if name in PREFECTURE_MAP:
        return PREFECTURE_MAP[name]
    for full_name, pref_id in PREFECTURE_MAP.items():
        if name in full_name or full_name.startswith(name):
            return pref_id
    return None
```

### `scripts/01_scrape.py`

```python
import requests
from bs4 import BeautifulSoup
import json
import time
import yaml
from tqdm import tqdm
from urllib.robotparser import RobotFileParser

def can_fetch(url: str) -> bool:
    rp = RobotFileParser()
    from urllib.parse import urlparse
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp.set_url(robots_url)
    try:
        rp.read()
        return rp.can_fetch('HanaNavBot/1.0', url)
    except Exception:
        return False

def scrape_source(source_config: dict) -> list[dict]:
    url = source_config["url"]
    if not can_fetch(url):
        print(f"⚠️  Skipped (robots.txt): {url}")
        return []

    headers = {"User-Agent": "HanaNavBot/1.0 (+https://hananav.example.com/bot)"}
    time.sleep(2)
    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")

    items = []
    for elem in soup.select(source_config["item_selector"]):
        image_urls = [
            img["src"] for img in elem.select("img")
            if img.get("src", "").startswith("http")
        ][:5]

        item = {
            "raw_name": elem.select_one(source_config["name_selector"]).get_text(strip=True),
            "raw_address": elem.select_one(source_config["address_selector"]).get_text(strip=True),
            "raw_description": elem.select_one(source_config["description_selector"]).get_text(strip=True),
            "official_url": elem.select_one("a")["href"] if elem.select_one("a") else None,
            "image_urls": image_urls,
            "source": source_config["source_name"],
            "source_url": url,
        }
        items.append(item)
    return items

def main():
    with open("config/sources.yaml", "r", encoding="utf-8") as f:
        sources = yaml.safe_load(f)

    all_items = []
    for source in tqdm(sources, desc="Scraping sources"):
        items = scrape_source(source)
        all_items.extend(items)
        print(f"✅ {source['source_name']}: {len(items)} items")

    with open("output/raw_data.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/02_normalize.py`

```python
import google.generativeai as genai
import json
import os
from tqdm import tqdm
from dotenv import load_dotenv
from config.prefecture_map import to_prefecture_id

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

PROMPT_TEMPLATE = """
以下の花畑スポットの生データを、必ずJSON形式のみで構造化してください。
他のテキストやマークダウンは絶対に含めないでください。

【入力データ】
{raw_data}

【出力形式】
{{
  "name": "正式名称",
  "name_kana": "ひらがな読み",
  "prefecture_name": "都道府県（例：東京都）",
  "location": "市区町村+番地を含む住所",
  "main_flowers": ["花の種類", "..."],
  "best_season_start": 開花開始月(1-12の整数),
  "best_season_end": 開花終了月(1-12の整数),
  "description": "100文字以内の説明",
  "access_info": "アクセス情報",
  "parking_info": "駐車場情報",
  "entrance_fee": "入場料"
}}

不明な項目は null にしてください。憶測で埋めないでください。
"""

def normalize_item(raw_item: dict) -> dict | None:
    prompt = PROMPT_TEMPLATE.format(raw_data=json.dumps(raw_item, ensure_ascii=False))
    response = model.generate_content(prompt)
    clean_json = response.text.replace("```json\n", "").replace("\n```", "").strip()

    try:
        normalized = json.loads(clean_json)
    except Exception:
        return None

    pref_name = normalized.get("prefecture_name")
    if pref_name:
        pref_id = to_prefecture_id(pref_name)
        if pref_id is None:
            print(f"⚠️  都道府県不明: {pref_name}")
            return None
        normalized["prefecture_id"] = pref_id

    normalized["official_url"] = raw_item.get("official_url")
    normalized["image_urls"] = raw_item.get("image_urls", [])
    normalized["source"] = raw_item.get("source")
    return normalized

def main():
    with open("output/raw_data.json", "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    normalized_items = []
    for item in tqdm(raw_items, desc="Normalizing"):
        result = normalize_item(item)
        if result:
            normalized_items.append(result)

    with open("output/normalized_data.json", "w", encoding="utf-8") as f:
        json.dump(normalized_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/03_geocode.py`

```python
import googlemaps
import json
import os
import time
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

def geocode(address: str) -> tuple[float, float] | None:
    try:
        result = gmaps.geocode(address, region="jp")
        if result:
            loc = result[0]["geometry"]["location"]
            return loc["lat"], loc["lng"]
    except Exception as e:
        print(f"⚠️  Geocode失敗: {address}: {e}")
    return None

def main():
    with open("output/normalized_data.json", "r", encoding="utf-8") as f:
        items = json.load(f)

    for item in tqdm(items, desc="Geocoding"):
        if item.get("location"):
            coords = geocode(item["location"])
            if coords:
                item["latitude"], item["longitude"] = coords
            time.sleep(0.1)

    with open("output/geocoded_data.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/04_validate.py`

```python
import requests
import json
from tqdm import tqdm

def validate(item: dict) -> bool:
    if item.get("official_url"):
        try:
            r = requests.head(item["official_url"], timeout=5, allow_redirects=True)
            if r.status_code >= 400:
                item["official_url"] = None
        except Exception:
            item["official_url"] = None

    # official_url が無い場合は source（出典）が必須
    if not item.get("official_url") and not item.get("source"):
        return False

    required = ["name", "prefecture_id", "location", "latitude", "longitude",
                "best_season_start", "best_season_end", "main_flowers"]
    return all(item.get(f) is not None for f in required)

def main():
    with open("output/geocoded_data.json", "r", encoding="utf-8") as f:
        items = json.load(f)

    valid_items = [item for item in tqdm(items, desc="Validating") if validate(item)]
    print(f"✅ Valid: {len(valid_items)}/{len(items)}")

    with open("output/validated_data.json", "w", encoding="utf-8") as f:
        json.dump(valid_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/05_upload.py`

```python
import os
import json
from tqdm import tqdm
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def upload_to_supabase(items: list[dict]):
    for item in tqdm(items, desc="Uploading"):
        # 1. spots テーブルにINSERT
        spot_data = {
            "name": item["name"],
            "name_kana": item.get("name_kana"),
            "prefecture_id": item["prefecture_id"],
            "location": item["location"],
            "coordinates": f"POINT({item['longitude']} {item['latitude']})",
            "official_url": item.get("official_url"),
            "access_info": item.get("access_info"),
            "parking_info": item.get("parking_info"),
            "entrance_fee": item.get("entrance_fee"),
            "best_season_start": item["best_season_start"],
            "best_season_end": item["best_season_end"],
            "description": item.get("description"),
            "source": item.get("source"),
            "is_published": False,  # 人手レビュー後にtrue化
        }
        spot_res = supabase.table("spots").insert(spot_data).execute()
        spot_id = spot_res.data[0]["id"]

        # 2. images テーブルに投入（display_orderは配列インデックス）
        for idx, url in enumerate(item.get("image_urls", [])):
            supabase.table("images").insert({
                "owner_type": "spot",
                "owner_id": spot_id,
                "url": url,
                "display_order": idx,
            }).execute()

        # 3. spot_flowers に投入（flowersテーブルとマッチング）
        for flower_name in item.get("main_flowers", []):
            flower = supabase.table("flowers")\
                .select("id")\
                .eq("name", flower_name)\
                .is_("deleted_at", "null")\
                .execute()

            if flower.data:
                supabase.table("spot_flowers").insert({
                    "spot_id": spot_id,
                    "flower_id": flower.data[0]["id"],
                    "bloom_start_month": item["best_season_start"],
                    "bloom_end_month": item["best_season_end"],
                }).execute()

def main():
    with open("output/validated_data.json", "r", encoding="utf-8") as f:
        items = json.load(f)
    upload_to_supabase(items)
    print(f"✅ Uploaded: {len(items)}")

if __name__ == "__main__":
    main()
```

### CSVフォーマット（手動投入用: `spots_seed.csv`）

```csv
name,name_kana,prefecture_id,location,latitude,longitude,official_url,access_info,parking_info,entrance_fee,best_season_start,best_season_end,main_flowers,description,source,image_urls
ひたち海浜公園,ひたちかいひんこうえん,8,茨城県ひたちなか市馬渡字大沼605-4,36.4029,140.5933,https://hitachikaihin.jp,...
```

| カラム | 型 | 必須 | 対応先 |
|---|---|---|---|
| name | string | ✅ | spots.name |
| name_kana | string | | spots.name_kana |
| prefecture_id | int(1-47) | ✅ | spots.prefecture_id |
| location | string | ✅ | spots.location |
| latitude | float | ✅ | spots.coordinates（POINT変換） |
| longitude | float | ✅ | spots.coordinates（POINT変換） |
| official_url | string | | spots.official_url |
| access_info | string | | spots.access_info |
| parking_info | string | | spots.parking_info |
| entrance_fee | string | | spots.entrance_fee |
| best_season_start | int(1-12) | ✅ | spots.best_season_start |
| best_season_end | int(1-12) | ✅ | spots.best_season_end |
| main_flowers | string | ✅ | spot_flowers経由（カンマ区切り） |
| description | string | | spots.description |
| source | string | ✅ | spots.source |
| image_urls | string | | images（セミコロン区切りで複数） |

