"""Geocoding API の疎通と住所組み立ての効果を確認する切り分けスクリプト。

03_geocode.py が `latitude` / `longitude` を埋めない場合に、どこで失敗しているかを
切り分けるための診断ツール。01-05 のパイプラインとは独立して動く。

使い方:

  # 1) デフォルトのテストケース（県名なし vs 県名あり）
  python scripts/check_geocode.py

  # 2) 任意の住所を 1 つ以上指定して試す
  python scripts/check_geocode.py "東京都立川市緑町3173" "立川市緑町3173"

  # 3) output/normalized_data.json の全件を、現状の location と
  #    prefecture_name + location の両パターンで試す
  python scripts/check_geocode.py --from-normalized

判定:
  - 両方 NG -> API キー / クォータ / Geocoding API 有効化を疑う
  - 県名なしだけ NG -> 03_geocode.py で prefecture_name を前置する修正で解決
  - 両方 OK だが座標がズレる -> 住所表記の精度不足、別途調整
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import googlemaps
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
NORMALIZED_PATH = ROOT / "output" / "normalized_data.json"

load_dotenv(ROOT / ".env")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_MAPS_API_KEY:
    raise SystemExit("GOOGLE_MAPS_API_KEY が未設定です。data_collector/.env を確認してください。")
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)


def try_geocode(address: str) -> str:
    """1 件 geocode を試し、結果を 1 行のサマリで返す。"""
    try:
        result = gmaps.geocode(address, region="jp")
    except Exception as e:
        return f"ERR '{address}' -> 例外 {type(e).__name__}: {e}"
    if not result:
        return f"NG  '{address}' -> 結果なし"
    loc = result[0]["geometry"]["location"]
    formatted = result[0].get("formatted_address", "")
    return f"OK  '{address}' -> lat={loc['lat']:.6f} lng={loc['lng']:.6f} ({formatted})"


def run_default_cases() -> None:
    cases = [
        "ひたちなか市馬渡字大沼605-4",
        "茨城県ひたちなか市馬渡字大沼605-4",
        "立川市緑町3173",
        "東京都立川市緑町3173",
    ]
    print("# デフォルトテストケース（県名なし vs 県名あり）")
    for q in cases:
        print(try_geocode(q))


def run_from_normalized() -> None:
    if not NORMALIZED_PATH.exists():
        raise SystemExit(f"{NORMALIZED_PATH} がありません。先に 02_normalize.py を実行してください。")
    with NORMALIZED_PATH.open("r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"# normalized_data.json の全 {len(items)} 件を 2 パターンで試行")
    for item in items:
        name = item.get("name") or "(no name)"
        location = item.get("location")
        prefecture = item.get("prefecture_name")
        print(f"\n## {name}")
        if not location:
            print("  skip: location なし")
            continue
        print(f"  [現状]   {try_geocode(location)}")
        if prefecture and prefecture not in location:
            combined = f"{prefecture}{location}"
            print(f"  [+県名]  {try_geocode(combined)}")
        else:
            print("  [+県名]  skip: prefecture_name が無い、または既に含まれる")


def run_addresses(addresses: list[str]) -> None:
    print(f"# 指定された {len(addresses)} 件を試行")
    for q in addresses:
        print(try_geocode(q))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "addresses",
        nargs="*",
        help="試したい住所（複数可）。未指定なら --from-normalized またはデフォルトケース",
    )
    parser.add_argument(
        "--from-normalized",
        action="store_true",
        help="output/normalized_data.json の全件を県名あり/なしで試行",
    )
    args = parser.parse_args()

    if args.from_normalized:
        run_from_normalized()
    elif args.addresses:
        run_addresses(args.addresses)
    else:
        run_default_cases()


if __name__ == "__main__":
    main()
