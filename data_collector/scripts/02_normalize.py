"""生データを Gemini で構造化 JSON に変換する。

- model: gemini-2.5-flash
- プロンプトには「不明は null、憶測で埋めない」を明示
- prefecture_name -> prefecture_id をマップで解決。解決不可ならアイテム自体を捨てる

入力: ../output/raw_data.json
出力: ../output/normalized_data.json
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "output" / "raw_data.json"
OUTPUT_PATH = ROOT / "output" / "normalized_data.json"

# scripts/ から実行されても config パッケージを import できるようにする
sys.path.insert(0, str(ROOT))
from config.prefecture_map import to_prefecture_id  # noqa: E402

load_dotenv(ROOT / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise SystemExit("GEMINI_API_KEY が未設定です。data_collector/.env を確認してください。")
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.5-flash"
# response_mime_type=application/json で素の JSON 文字列を返させる（```json フェンス対策）
GENERATE_CONFIG = types.GenerateContentConfig(response_mime_type="application/json")

PROMPT_TEMPLATE = """\
以下の花畑スポットの生データを、必ず JSON 形式のみで構造化してください。
他のテキストやマークダウン（```json など）は絶対に含めないでください。

【入力データ】
{raw_data}

【出力形式】
{{
  "name": "正式名称",
  "name_kana": "ひらがな読み",
  "prefecture_name": "都道府県（例: 東京都）",
  "location": "市区町村+番地を含む住所",
  "main_flowers": ["花の種類", "..."],
  "best_season_start": 開花開始月(1-12 の整数),
  "best_season_end": 開花終了月(1-12 の整数),
  "description": "100 文字以内の説明",
  "access_info": "アクセス情報",
  "parking_info": "駐車場情報",
  "entrance_fee": "入場料"
}}

不明な項目は null にしてください。憶測で埋めないでください。
"""


def _strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # ```json ... ``` を剥がす
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
        if cleaned.endswith("```"):
            cleaned = cleaned[: -len("```")]
    return cleaned.strip()


def normalize_item(raw_item: dict) -> dict | None:
    prompt = PROMPT_TEMPLATE.format(raw_data=json.dumps(raw_item, ensure_ascii=False))
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=GENERATE_CONFIG,
        )
    except Exception as e:
        print(f"warn: Gemini 呼び出し失敗: {e}", file=sys.stderr)
        return None

    raw_text = response.text or ""
    try:
        normalized = json.loads(_strip_code_fence(raw_text))
    except Exception as e:
        print(f"warn: JSON パース失敗: {e}", file=sys.stderr)
        return None

    # hanamap など raw_address が無いソース向けフォールバック:
    # Gemini が prefecture_name を埋められなかった場合、scraper が抽出した prefecture_hint を採用
    if not normalized.get("prefecture_name") and raw_item.get("prefecture_hint"):
        normalized["prefecture_name"] = raw_item["prefecture_hint"]
    # 同様に main_flowers が空なら scraper の flower_tags を採用
    if not normalized.get("main_flowers") and raw_item.get("flower_tags"):
        normalized["main_flowers"] = raw_item["flower_tags"]

    pref_id = to_prefecture_id(normalized.get("prefecture_name"))
    if pref_id is None:
        print(f"warn: 都道府県不明、スキップ: {normalized.get('prefecture_name')}", file=sys.stderr)
        return None
    normalized["prefecture_id"] = pref_id

    # 生データ由来の項目を引き継ぐ（Gemini は推測しない）
    normalized["official_url"] = raw_item.get("official_url")
    normalized["image_urls"] = raw_item.get("image_urls", [])
    normalized["source"] = raw_item.get("source")
    normalized["source_url"] = raw_item.get("source_url")
    # 03_geocode.py の Places API フォールバックで参照するため hint を引き継ぐ
    normalized["prefecture_hint"] = raw_item.get("prefecture_hint")
    return normalized


def main() -> None:
    with INPUT_PATH.open("r", encoding="utf-8") as f:
        raw_items = json.load(f)

    normalized_items: list[dict] = []
    for item in tqdm(raw_items, desc="Normalizing"):
        result = normalize_item(item)
        if result:
            normalized_items.append(result)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(normalized_items, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(normalized_items)}/{len(raw_items)} items -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
