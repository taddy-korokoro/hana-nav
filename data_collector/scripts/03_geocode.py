"""住所/名称 → 緯度経度 を Google Maps API で解決する。

2 段階フォールバック:
  1. `location`（住所）があれば Geocoding API で解決
     - 02 の prefecture_name が location に含まれない場合は前置して曖昧性を解消
  2. それでも解決できない or 住所自体が無い場合は Places API "Find Place from Text" で
     `prefecture + name` から候補を検索し、formatted_address と座標を取得
     - 解決した住所は item["location"] に書き戻し、spots.location（NOT NULL）を満たす

Places API は Geocoding より高い（$17/1000 reqs）ため、location がある場合は呼ばない。
hanamap.com など住所欠落ソース向けの救済路線。

入力: ../output/normalized_data.json
出力: ../output/geocoded_data.json
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import googlemaps
from dotenv import load_dotenv
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "output" / "normalized_data.json"
OUTPUT_PATH = ROOT / "output" / "geocoded_data.json"

SLEEP_BETWEEN_REQUESTS_SEC = 0.1

load_dotenv(ROOT / ".env")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_MAPS_API_KEY:
    raise SystemExit("GOOGLE_MAPS_API_KEY が未設定です。data_collector/.env を確認してください。")
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)


def _build_address_query(item: dict) -> str | None:
    location = item.get("location")
    if not location:
        return None
    prefecture = item.get("prefecture_name") or item.get("prefecture_hint")
    if prefecture and prefecture not in location:
        return f"{prefecture}{location}"
    return location


def geocode(address: str) -> tuple[float, float] | None:
    try:
        result = gmaps.geocode(address, region="jp")
    except Exception as e:
        print(f"warn: geocode 失敗 address={address} err={e}", file=sys.stderr)
        return None
    if not result:
        # 空配列も無音で流すと API 未有効化や住所曖昧をサイレントに見逃すため warning に出す
        print(f"warn: geocode 結果なし address={address}", file=sys.stderr)
        return None
    loc = result[0]["geometry"]["location"]
    return float(loc["lat"]), float(loc["lng"])


def find_place(name: str, prefecture: str | None) -> tuple[float, float, str] | None:
    """Places API "Find Place from Text" で名称から住所・座標を解決。

    戻り値: (lat, lng, formatted_address)。失敗時は None。
    """
    query = f"{prefecture} {name}" if prefecture else name
    try:
        result = gmaps.find_place(
            input=query,
            input_type="textquery",
            fields=["formatted_address", "geometry/location", "name"],
            language="ja",
        )
    except Exception as e:
        print(f"warn: find_place 失敗 query={query} err={e}", file=sys.stderr)
        return None

    status = result.get("status")
    candidates = result.get("candidates") or []
    if status != "OK" or not candidates:
        print(f"warn: find_place 結果なし query={query} status={status}", file=sys.stderr)
        return None

    cand = candidates[0]
    loc = (cand.get("geometry") or {}).get("location")
    formatted = cand.get("formatted_address")
    if not loc or not formatted:
        print(f"warn: find_place 不完全な応答 query={query} cand={cand}", file=sys.stderr)
        return None
    return float(loc["lat"]), float(loc["lng"]), formatted


def resolve(item: dict) -> tuple[float, float, str] | None:
    """1) 住所優先で Geocoding、2) 失敗 or 住所欠落なら Places API。

    戻り値: (lat, lng, location)。location は item["location"] に書き戻す前提（NOT NULL 維持）。
    """
    query = _build_address_query(item)
    if query:
        coords = geocode(query)
        if coords:
            return coords[0], coords[1], item["location"]

    # 住所が無い or Geocoding 失敗 → Places API へフォールバック
    name = item.get("name")
    prefecture = item.get("prefecture_name") or item.get("prefecture_hint")
    if not (name and prefecture):
        return None
    placed = find_place(name, prefecture)
    if not placed:
        return None
    lat, lng, addr = placed
    return lat, lng, addr


def main() -> None:
    with INPUT_PATH.open("r", encoding="utf-8") as f:
        items = json.load(f)

    success = 0
    for item in tqdm(items, desc="Geocoding"):
        result = resolve(item)
        if result:
            lat, lng, addr = result
            item["latitude"] = lat
            item["longitude"] = lng
            # Places API 経由で解決した場合、住所が無かった item にも location が入る
            item["location"] = addr
            success += 1
        time.sleep(SLEEP_BETWEEN_REQUESTS_SEC)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"geocoded {success}/{len(items)} items -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
