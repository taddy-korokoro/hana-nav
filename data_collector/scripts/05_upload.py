"""validated_data.json を Supabase に投入する。

ポイント:
- spots は is_published=false で投入し、管理画面で人手レビュー → 公開する運用
- images は多態関連のため外部キーが張れない。INSERT 前に親 spot の存在を必ず確認する
  （DB 側にも validate_image_owner_trigger があるが、アプリ層でも同じ A 層検証を行う）
- flowers は name 一致 → flower_aliases.alias 一致 の順で解決する
  どちらにも一致しなければ warning を出してスキップ（運用で flowers / flower_aliases を増やす）

入力: ../output/validated_data.json
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "output" / "validated_data.json"

load_dotenv(ROOT / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise SystemExit(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。data_collector/.env を確認してください。"
    )
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _validate_spot_exists(spot_id: str) -> bool:
    """images INSERT 前の A 層チェック（lib/utils/imageValidator.ts の Python 版）。"""
    res = (
        supabase.table("spots")
        .select("id")
        .eq("id", spot_id)
        .is_("deleted_at", "null")
        .maybe_single()
        .execute()
    )
    return res.data is not None


def _resolve_flower_id(flower_name: str) -> str | None:
    """flowers.name → flower_aliases.alias の順で flower_id を解決する。"""
    direct = (
        supabase.table("flowers")
        .select("id")
        .eq("name", flower_name)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    if direct.data:
        return direct.data[0]["id"]

    alias = (
        supabase.table("flower_aliases")
        .select("flower_id")
        .eq("alias", flower_name)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    if alias.data:
        return alias.data[0]["flower_id"]
    return None


def _insert_spot(item: dict) -> str:
    payload = {
        "name": item["name"],
        "name_kana": item.get("name_kana"),
        "prefecture_id": item["prefecture_id"],
        "location": item["location"],
        # PostGIS は POINT(lng lat) の順（経度→緯度）
        "coordinates": f"POINT({item['longitude']} {item['latitude']})",
        "official_url": item.get("official_url"),
        "access_info": item.get("access_info"),
        "parking_info": item.get("parking_info"),
        "entrance_fee": item.get("entrance_fee"),
        "best_season_start": item["best_season_start"],
        "best_season_end": item["best_season_end"],
        "description": item.get("description"),
        "source": item.get("source"),
        "is_published": False,  # 人手レビュー後に true 化
    }
    res = supabase.table("spots").insert(payload).execute()
    return res.data[0]["id"]


def _insert_images(spot_id: str, image_urls: list[str]) -> None:
    if not image_urls:
        return
    if not _validate_spot_exists(spot_id):
        print(f"warn: 親 spot が見つからず images 投入をスキップ spot_id={spot_id}", file=sys.stderr)
        return
    rows = [
        {
            "owner_type": "spot",
            "owner_id": spot_id,
            "url": url,
            "display_order": idx,
        }
        for idx, url in enumerate(image_urls)
    ]
    supabase.table("images").insert(rows).execute()


def _insert_spot_flowers(spot_id: str, item: dict) -> None:
    for flower_name in item.get("main_flowers", []):
        flower_id = _resolve_flower_id(flower_name)
        if not flower_id:
            print(
                f"warn: flowers 未マッチ name={flower_name} spot={item.get('name')}",
                file=sys.stderr,
            )
            continue
        supabase.table("spot_flowers").insert(
            {
                "spot_id": spot_id,
                "flower_id": flower_id,
                "bloom_start_month": item["best_season_start"],
                "bloom_end_month": item["best_season_end"],
            }
        ).execute()


def upload(items: list[dict]) -> int:
    uploaded = 0
    for item in tqdm(items, desc="Uploading"):
        try:
            spot_id = _insert_spot(item)
            _insert_images(spot_id, item.get("image_urls", []))
            _insert_spot_flowers(spot_id, item)
            uploaded += 1
        except Exception as e:
            print(f"error: upload 失敗 name={item.get('name')} err={e}", file=sys.stderr)
    return uploaded


def main() -> None:
    with INPUT_PATH.open("r", encoding="utf-8") as f:
        items = json.load(f)
    uploaded = upload(items)
    print(f"uploaded {uploaded}/{len(items)}")


if __name__ == "__main__":
    main()
