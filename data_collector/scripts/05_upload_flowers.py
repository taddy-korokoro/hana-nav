"""flowers_raw_data.json を Supabase の flowers / flower_aliases / images に投入する。

設計方針:
- 既存花とのマージ: greensnap の名称が
    1) flowers.name に完全一致 → その行を UPDATE
    2) flower_aliases.alias に一致 → 親 flower を UPDATE（例: greensnap「サクラ」→ seed の「桜」）
    3) 上記いずれにも該当しない → 新規 INSERT
  これにより「桜」と「サクラ」が別レコードとして量産されるのを防ぐ。

- 既存値の保護: UPDATE 時は「既存が NULL のフィールドだけ greensnap で埋める」。
  description / default_season_* など admin が後から編集する可能性があるカラムを上書きしない。
  新カラム（cultivation_difficulty 等）は初回 NULL 確定なので素直に埋まる。

- 値の正規化: 日本語ラベル → SCREAMING_SNAKE_CASE 英語識別子。
  マップ未定義の値は warning を出して NULL で投入（CHECK 違反を避ける）。

- name_kana の自動生成: scraper は kana を取得しないため、Gemini 2.5 Flash で花名 →
  ひらがな読みを生成して投入する。新規 INSERT 時は必ず、既存 UPDATE 時は name_kana が
  NULL の行のみ呼ぶ（API 呼出と費用の節約）。生成結果はひらがな + 長音「ー」のみを
  許容し、汚れたら NULL のまま放置（一覧画面の 50 音グルーピングが「他」へ落とす）。

- idempotent: 同名 alias / 同 URL image を事前チェックして重複投入を防ぐ。
  display_order は既存の MAX + 1（初回は 0）。

- セキュリティ境界: images INSERT 前に _validate_flower_exists で親存在を A 層検証
  （lib/utils/imageValidator.ts と同等の保護。DB トリガー validate_image_owner_trigger は B 層）。

入力: ../output/flowers_raw_data.json
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import Client, create_client
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "output" / "flowers_raw_data.json"

load_dotenv(ROOT / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise SystemExit(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。data_collector/.env を確認してください。"
    )
if not GEMINI_API_KEY:
    raise SystemExit("GEMINI_API_KEY が未設定です。data_collector/.env を確認してください。")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
gemini = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = "gemini-2.5-flash"
# 花名 → 読みは決定論的にしたいので temperature=0 + JSON モード
KANA_CONFIG = types.GenerateContentConfig(
    temperature=0.0,
    response_mime_type="application/json",
)

# ひらがな + 長音 + 一部許容文字のみを正解として受ける
_HIRAGANA_RE = re.compile(r"^[ぁ-んー]+$")
KANA_PROMPT = (
    "花の名前「{name}」のひらがな読みを、次の JSON 形式で返してください: "
    '{{"kana": "ひらがな読み"}}。'
    "読みが分からない場合は kana を null にしてください。"
    "ひらがなと長音記号「ー」のみを使い、空白・記号・カタカナ・漢字は含めないでください。"
)

# 日本語ラベル → DB 内部表現（CHECK 制約の許容値、英語識別子）
DIFFICULTY_MAP: dict[str, str] = {
    "易しい": "EASY",
    "やや易しい": "SLIGHTLY_EASY",
    "普通": "NORMAL",
    "やや難しい": "SLIGHTLY_HARD",
    "難しい": "HARD",
}
TOLERANCE_MAP: dict[str, str] = {
    "強い": "STRONG",
    "やや強い": "SLIGHTLY_STRONG",
    "普通": "NORMAL",
    "やや弱い": "SLIGHTLY_WEAK",
    "弱い": "WEAK",
}
SHADE_MAP: dict[str, str] = {
    "あり": "AVAILABLE",
    "なし": "UNAVAILABLE",
}


def _map_value(value: str | None, mapping: dict[str, str], field_name: str) -> str | None:
    """日本語ラベル → 英語識別子。マップ未定義の値は warning + NULL を返す。

    CHECK 違反になる値を DB に流さないための防衛策。表記揺れが見つかったら
    マップ追加 or CHECK 制約緩和で対応する。
    """
    if not value:
        return None
    if value in mapping:
        return mapping[value]
    print(f"warn: {field_name} マップ未定義 value={value!r}", file=sys.stderr)
    return None


def _generate_kana(name: str) -> str | None:
    """Gemini で花名 → ひらがな読みを生成。

    一覧画面の 50 音インデックス（lib/queries/flowers.ts の classifyKana）が
    name_kana の先頭文字をひらがな範囲で判定するため、ひらがな以外が混じると
    「他」行に落ちる。`_HIRAGANA_RE` で軽くバリデーションし、不合格なら NULL。
    失敗時も NULL を返し、呼び出し側でカラムを埋めない。
    """
    if not name:
        return None
    prompt = KANA_PROMPT.format(name=name)
    try:
        resp = gemini.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=KANA_CONFIG,
        )
    except Exception as e:
        print(f"warn: kana 生成失敗 name={name!r} err={e}", file=sys.stderr)
        return None
    raw = (resp.text or "").strip()
    try:
        parsed = json.loads(raw)
    except Exception:
        print(f"warn: kana 生成 JSON 解析失敗 name={name!r} raw={raw!r}", file=sys.stderr)
        return None
    kana = parsed.get("kana") if isinstance(parsed, dict) else None
    if not isinstance(kana, str):
        return None
    kana = kana.strip()
    if not _HIRAGANA_RE.match(kana):
        print(f"warn: kana 生成結果が非ひらがな name={name!r} kana={kana!r}", file=sys.stderr)
        return None
    return kana


def _find_flower_id(name: str) -> str | None:
    """flowers.name 完全一致 → flower_aliases.alias 一致 の順で既存 flower_id を解決。"""
    direct = (
        supabase.table("flowers")
        .select("id")
        .eq("name", name)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    if direct.data:
        return direct.data[0]["id"]

    alias = (
        supabase.table("flower_aliases")
        .select("flower_id")
        .eq("alias", name)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    if alias.data:
        return alias.data[0]["flower_id"]
    return None


def _fetch_flower(flower_id: str) -> dict | None:
    res = (
        supabase.table("flowers")
        .select(
            "id, name, name_kana, description, default_season_start, default_season_end, "
            "cultivation_difficulty, cold_tolerance, heat_tolerance, shade_tolerance"
        )
        .eq("id", flower_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _build_payload(item: dict) -> dict:
    return {
        "description": item.get("description"),
        "default_season_start": item.get("bloom_month_start"),
        "default_season_end": item.get("bloom_month_end"),
        "cultivation_difficulty": _map_value(
            item.get("cultivation_difficulty"), DIFFICULTY_MAP, "cultivation_difficulty"
        ),
        "cold_tolerance": _map_value(item.get("cold_tolerance"), TOLERANCE_MAP, "cold_tolerance"),
        "heat_tolerance": _map_value(item.get("heat_tolerance"), TOLERANCE_MAP, "heat_tolerance"),
        "shade_tolerance": _map_value(item.get("shade_tolerance"), SHADE_MAP, "shade_tolerance"),
    }


def _upsert_flower(item: dict) -> tuple[str, str]:
    """flowers を UPSERT し、(flower_id, action) を返す。action は 'inserted' or 'updated' or 'unchanged'。

    name_kana は scrapeソースが取得していないので Gemini で生成する。
    - 新規 INSERT 時: 必ず生成
    - 既存 UPDATE 時: 既存 name_kana が NULL の場合だけ生成（API 呼出を節約）
    """
    name = item["name"]
    payload = _build_payload(item)
    existing_id = _find_flower_id(name)

    if existing_id is None:
        # 新規 INSERT: NOT NULL の name は必須。他は NULL 許可
        kana = _generate_kana(name)
        if kana:
            payload["name_kana"] = kana
        insert_data = {"name": name, **{k: v for k, v in payload.items() if v is not None}}
        res = supabase.table("flowers").insert(insert_data).execute()
        return res.data[0]["id"], "inserted"

    # 既存 UPDATE: 「既存が NULL のフィールドだけ greensnap で埋める」ポリシー
    existing = _fetch_flower(existing_id)
    if not existing:
        # 直前で取れたのに取り直すと無い → 並行更新時のレース。何もしない
        return existing_id, "unchanged"

    # name_kana も同ポリシーで補完（既存 NULL のときだけ Gemini を呼んで埋める）
    if existing.get("name_kana") is None:
        kana = _generate_kana(name)
        if kana:
            payload["name_kana"] = kana

    update_data = {
        k: v
        for k, v in payload.items()
        if v is not None and existing.get(k) is None
    }
    if not update_data:
        return existing_id, "unchanged"
    supabase.table("flowers").update(update_data).eq("id", existing_id).execute()
    return existing_id, "updated"


def _insert_aliases(flower_id: str, aliases: list[str], primary_name: str) -> int:
    """新規 alias を flower_aliases に投入。既存 alias と本花名は skip。"""
    if not aliases:
        return 0
    inserted = 0
    for alias in aliases:
        alias = alias.strip()
        if not alias or alias == primary_name:
            continue
        # 既に flower_aliases.alias にあれば skip（UNIQUE 制約があるため事前チェック）
        existing = (
            supabase.table("flower_aliases")
            .select("id")
            .eq("alias", alias)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if existing.data:
            continue
        # flowers.name にも被っていれば skip（同名 flower が別 ID で存在するケース）
        same_name_flower = (
            supabase.table("flowers")
            .select("id")
            .eq("name", alias)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if same_name_flower.data:
            continue
        supabase.table("flower_aliases").insert(
            {"flower_id": flower_id, "alias": alias}
        ).execute()
        inserted += 1
    return inserted


def _validate_flower_exists(flower_id: str) -> bool:
    """images INSERT 前の A 層チェック（lib/utils/imageValidator.ts 相当）。"""
    res = (
        supabase.table("flowers")
        .select("id")
        .eq("id", flower_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    return bool(res.data)


def _insert_image(flower_id: str, url: str | None) -> bool:
    if not url:
        return False
    # 同一 URL の重複投入を回避
    existing = (
        supabase.table("images")
        .select("id")
        .eq("owner_type", "flower")
        .eq("owner_id", flower_id)
        .eq("url", url)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    if existing.data:
        return False
    if not _validate_flower_exists(flower_id):
        print(f"warn: 親 flower 不在で image スキップ flower_id={flower_id}", file=sys.stderr)
        return False
    # display_order: 既存の MAX + 1（初回は 0）
    last = (
        supabase.table("images")
        .select("display_order")
        .eq("owner_type", "flower")
        .eq("owner_id", flower_id)
        .is_("deleted_at", "null")
        .order("display_order", desc=True)
        .limit(1)
        .execute()
    )
    next_order = (last.data[0]["display_order"] + 1) if last.data else 0
    supabase.table("images").insert(
        {
            "owner_type": "flower",
            "owner_id": flower_id,
            "url": url,
            "display_order": next_order,
        }
    ).execute()
    return True


def upload(items: list[dict]) -> dict:
    stats = {"inserted": 0, "updated": 0, "unchanged": 0, "aliases": 0, "images": 0, "errors": 0}
    for item in tqdm(items, desc="Uploading flowers"):
        try:
            flower_id, action = _upsert_flower(item)
            stats[action] += 1
            stats["aliases"] += _insert_aliases(flower_id, item.get("aliases", []), item["name"])
            if _insert_image(flower_id, item.get("image_url")):
                stats["images"] += 1
        except Exception as e:
            print(f"error: upload 失敗 name={item.get('name')} err={e}", file=sys.stderr)
            stats["errors"] += 1
    return stats


def main() -> None:
    with INPUT_PATH.open("r", encoding="utf-8") as f:
        items = json.load(f)
    stats = upload(items)
    print(
        "summary: "
        f"inserted={stats['inserted']} updated={stats['updated']} unchanged={stats['unchanged']} "
        f"aliases+={stats['aliases']} images+={stats['images']} errors={stats['errors']}"
    )


if __name__ == "__main__":
    main()
