"""バリデーション工程。

- official_url の HEAD リクエストで生存確認、404/5xx ならクリアして source へフォールバック
- official_url が無い場合は source（出典）必須（オーバーツーリズム対策、CLAUDE.md 参照）
- 必須項目（spots NOT NULL カラムに対応）が揃っていないアイテムは捨てる

入力: ../output/geocoded_data.json
出力: ../output/validated_data.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import requests
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "output" / "geocoded_data.json"
OUTPUT_PATH = ROOT / "output" / "validated_data.json"

HEAD_TIMEOUT_SEC = 5

REQUIRED_FIELDS = (
    "name",
    "prefecture_id",
    "location",
    "latitude",
    "longitude",
    "best_season_start",
    "best_season_end",
    "main_flowers",
)


def _check_url_alive(url: str) -> bool:
    try:
        r = requests.head(url, timeout=HEAD_TIMEOUT_SEC, allow_redirects=True)
    except Exception:
        return False
    if r.status_code >= 400:
        return False
    return True


def validate(item: dict) -> bool:
    if item.get("official_url"):
        if not _check_url_alive(item["official_url"]):
            item["official_url"] = None

    # official_url が無い場合は source（出典）が必須
    if not item.get("official_url") and not item.get("source"):
        return False

    for field in REQUIRED_FIELDS:
        if item.get(field) in (None, "", []):
            return False
    return True


def main() -> None:
    with INPUT_PATH.open("r", encoding="utf-8") as f:
        items = json.load(f)

    valid_items = [item for item in tqdm(items, desc="Validating") if validate(item)]
    print(f"valid {len(valid_items)}/{len(items)}", file=sys.stderr)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(valid_items, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(valid_items)} items -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
