"""greensnap.jp 花マスター専用スクレイパ（2 段：一覧→詳細）。

階層:
  /category1/flower                       → 一覧 1 ページ目
  /category1/flower/botany/list?p={N}     → 一覧 N ページ目（最大 32 ページ ≒ 320 花）
  /category1/flower/botany/{id}/growth    → 花の詳細ページ

実装方針:
- robots.txt 確認（greensnap は /category1/*/post/list? 等の一部のみ Disallow、本パスは許可）
- User-Agent: HanaNavBot、リクエスト間に 2 秒スリープ
- 取得項目:
    花名、画像、花詳細（説明文）、別名、栽培難易度、耐寒性、耐暑性、耐陰性、開花月
- DB マッピング:
    flowers テーブル: name, description, default_season_start, default_season_end,
                     cultivation_difficulty, cold_tolerance, heat_tolerance, shade_tolerance
    flower_aliases:   alias（別名を 、/, で split して 1 行ずつ）
    images:           owner_type='flower', url, display_order
- 開花月の解析: dt.c-labelDlList「開花」の dd は「5月\\n、6月、7月、...」のように
  改行/全角コンマ混在のため、正規表現で月数値だけ抽出する

出力: ../output/flowers_raw_data.json

設定: ../config/greensnap_flowers.yaml
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
import yaml
from bs4 import BeautifulSoup, Tag
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "greensnap_flowers.yaml"
OUTPUT_PATH = ROOT / "output" / "flowers_raw_data.json"

USER_AGENT = "HanaNavBot/1.0 (+https://hananav.example.com/bot)"
REQUEST_TIMEOUT_SEC = 10
SOURCE_NAME = "greensnap"

# 花カード一覧コンテナ（spec 指定）
LIST_CONTAINER_SELECTOR = ".l-categoryVarieties_list"

# dt.c-labelDlList から拾うラベルと出力キーのマップ
LABEL_TO_FIELD = {
    "別名": "aliases",
    "栽培難易度": "cultivation_difficulty",
    "耐寒性": "cold_tolerance",
    "耐暑性": "heat_tolerance",
    "耐陰性": "shade_tolerance",
    "開花": "bloom_raw",
}

_MONTH_RE = re.compile(r"(\d+)月")
# 別名の区切り（、／,／全角スペース等を許容）
_ALIAS_SPLIT_RE = re.compile(r"[、,／/]\s*")


def can_fetch(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    rp.set_url(robots_url)
    try:
        rp.read()
    except Exception as e:
        print(f"warn: robots.txt 取得失敗 url={url} err={e}", file=sys.stderr)
        return False
    return rp.can_fetch(USER_AGENT, url)


def fetch(url: str, sleep_sec: float) -> BeautifulSoup | None:
    time.sleep(sleep_sec)
    try:
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SEC,
        )
    except Exception as e:
        print(f"warn: HTTP リクエスト失敗 url={url} err={e}", file=sys.stderr)
        return None
    if response.status_code >= 400:
        print(f"warn: HTTP {response.status_code} url={url}", file=sys.stderr)
        return None
    return BeautifulSoup(response.text, "html.parser")


def collect_cards_from_list(soup: BeautifulSoup) -> list[Tag]:
    container = soup.select_one(LIST_CONTAINER_SELECTOR)
    if not container:
        return []
    # 直下要素が 1 花カード = <div>...</div>
    return [child for child in container.find_all(recursive=False) if isinstance(child, Tag)]


def _detail_url_from_card(card: Tag, base_url: str) -> str | None:
    """カード内の a.p-listPlant の href から /botany/{id}/growth を組み立てる。

    一覧ページの a.p-listPlant は /category1/flower/botany/{id}（growth なし）を指すため、
    spec 指定の「/growth 付き詳細ページ」へリンクを補正する。
    """
    link = card.select_one("a.p-listPlant")
    if not link:
        return None
    href = link.get("href")
    if not href:
        return None
    absolute = urljoin(base_url, href)
    if not absolute.endswith("/growth"):
        absolute = absolute.rstrip("/") + "/growth"
    return absolute


def _name_from_card(card: Tag) -> str | None:
    heading = card.select_one('[class*="p-listPlant_heading"]')
    if not heading:
        return None
    text = heading.get_text(strip=True)
    return text or None


def _image_from_card(card: Tag, base_url: str) -> str | None:
    img = card.select_one("img.variable_image, img[class*=variable_image]")
    if not img:
        return None
    src = img.get("src") or img.get("data-src")
    if not src:
        return None
    absolute = urljoin(base_url, src)
    # greensnap の cloudfront 配信は古い記事で http:// になっているケースがある。
    # 同じホストは https でも到達できるため、next/image の remotePatterns（https のみ）
    # と整合するように強制的に https に書き換える（mixed content も回避）。
    if absolute.startswith("http://"):
        absolute = "https://" + absolute[len("http://") :]
    return absolute


def _parse_bloom_months(text: str | None) -> list[int]:
    if not text:
        return []
    months = []
    seen: set[int] = set()
    for m in _MONTH_RE.findall(text):
        n = int(m)
        if 1 <= n <= 12 and n not in seen:
            seen.add(n)
            months.append(n)
    return months


def _parse_aliases(text: str | None) -> list[str]:
    if not text:
        return []
    parts = [p.strip() for p in _ALIAS_SPLIT_RE.split(text)]
    return [p for p in parts if p]


def _extract_labels(soup: BeautifulSoup) -> dict[str, str]:
    """dt.c-labelDlList の各ラベル + 次の dd を辞書化する。

    値は dd.get_text() を strip した文字列。複数月のように改行+空白を含む場合は
    呼び出し側のパーサで処理する。
    """
    result: dict[str, str] = {}
    for dt in soup.select("dt.c-labelDlList"):
        label = dt.get_text(strip=True)
        if label not in LABEL_TO_FIELD:
            continue
        dd = dt.find_next_sibling("dd")
        if not dd:
            continue
        value = dd.get_text(strip=True)
        if value:
            result[label] = value
    return result


def _extract_description(soup: BeautifulSoup) -> str | None:
    """l-article_contents 配下の最初の p を花詳細として採用。

    クラス末尾の数値（mb40 / mb48 等）に揺れがあるため前方一致セレクタを使う。
    """
    container = soup.select_one('[class*="l-article_contents"]')
    if not container:
        return None
    p = container.find("p")
    if not p:
        return None
    text = p.get_text(strip=True)
    return text or None


def fetch_detail(detail_url: str, sleep_sec: float) -> dict:
    soup = fetch(detail_url, sleep_sec)
    if not soup:
        return {}

    description = _extract_description(soup)
    labels = _extract_labels(soup)

    bloom_months = _parse_bloom_months(labels.get("開花"))
    aliases = _parse_aliases(labels.get("別名"))

    return {
        "description": description,
        "aliases": aliases,
        "cultivation_difficulty": labels.get("栽培難易度"),
        "cold_tolerance": labels.get("耐寒性"),
        "heat_tolerance": labels.get("耐暑性"),
        "shade_tolerance": labels.get("耐陰性"),
        "bloom_months": bloom_months,
        # default_season_start / end は min / max。連続でない月が混じる場合も
        # 範囲表現に丸めるが、bloom_months 配列も保持して後段で再利用可能にする
        "bloom_month_start": min(bloom_months) if bloom_months else None,
        "bloom_month_end": max(bloom_months) if bloom_months else None,
    }


def build_list_url(base_url: str, list_path: str, list_paginated_path: str, page: int) -> str:
    if page <= 1:
        return urljoin(base_url, list_path)
    return urljoin(base_url, f"{list_paginated_path}?p={page}")


def main() -> None:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

    base_url: str = config["base_url"]
    list_path: str = config.get("list_path", "/category1/flower")
    list_paginated_path: str = config.get("list_paginated_path", "/category1/flower/botany/list")
    max_pages = config.get("max_pages")
    sleep_sec = float(config.get("sleep_sec", 2.0))

    if not can_fetch(urljoin(base_url, list_path)):
        print(f"error: robots.txt で拒否 url={base_url}{list_path}", file=sys.stderr)
        return

    all_items: list[dict] = []
    page = 1
    while True:
        if max_pages and page > max_pages:
            break
        list_url = build_list_url(base_url, list_path, list_paginated_path, page)
        soup = fetch(list_url, sleep_sec)
        if not soup:
            break
        cards = collect_cards_from_list(soup)
        if not cards:
            break
        print(f"info: page={page} cards={len(cards)} url={list_url}")

        for card in tqdm(cards, desc=f"page {page}", leave=False):
            name = _name_from_card(card)
            if not name:
                print("warn: 花名取れず、スキップ", file=sys.stderr)
                continue
            detail_url = _detail_url_from_card(card, base_url)
            image_url = _image_from_card(card, base_url)

            detail = fetch_detail(detail_url, sleep_sec) if detail_url else {}

            all_items.append(
                {
                    "name": name,
                    "image_url": image_url,
                    "source": SOURCE_NAME,
                    "source_url": detail_url,
                    **detail,
                }
            )

        page += 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(all_items)} flowers -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
