"""観光協会等のサイトをスクレイピングして生データを取得する。

実行前提:
- スクレイピング対象は必ず robots.txt を確認し、許可されたパスのみ取得する
- User-Agent は HanaNavBot と名乗り、リクエスト間に 2 秒以上のスリープを入れる
- 画像は 1 件あたり最大 5 件まで取得（display_order は配列インデックス）

出力: ../output/raw_data.json
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
import yaml
from bs4 import BeautifulSoup
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "sources.yaml"
OUTPUT_PATH = ROOT / "output" / "raw_data.json"

USER_AGENT = "HanaNavBot/1.0 (+https://hananav.example.com/bot)"
REQUEST_TIMEOUT_SEC = 10
SLEEP_BETWEEN_REQUESTS_SEC = 2.0
MAX_IMAGES_PER_ITEM = 5


def can_fetch(url: str) -> bool:
    """robots.txt を読み、HanaNavBot/1.0 で当該 URL を取得して良いか判定する。"""
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    rp.set_url(robots_url)
    try:
        rp.read()
    except Exception as e:
        # robots.txt が読めない＝拒否側に倒す（オーバーツーリズム配慮の安全側）
        print(f"warn: robots.txt 取得失敗、スキップします url={url} err={e}", file=sys.stderr)
        return False
    return rp.can_fetch(USER_AGENT, url)


def _text_or_none(elem: Any, selector: str) -> str | None:
    found = elem.select_one(selector)
    return found.get_text(strip=True) if found else None


def _collect_image_urls(elem: Any, base_url: str) -> list[str]:
    urls: list[str] = []
    for img in elem.select("img"):
        src = img.get("src")
        if not src:
            continue
        absolute = urljoin(base_url, src)
        if absolute.startswith("http"):
            urls.append(absolute)
        if len(urls) >= MAX_IMAGES_PER_ITEM:
            break
    return urls


def scrape_source(source_config: dict) -> list[dict]:
    url: str = source_config["url"]
    source_name: str = source_config["source_name"]

    if not can_fetch(url):
        print(f"skipped (robots.txt): {url}", file=sys.stderr)
        return []

    headers = {"User-Agent": USER_AGENT}
    time.sleep(SLEEP_BETWEEN_REQUESTS_SEC)
    response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_SEC)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    items: list[dict] = []
    for elem in soup.select(source_config["item_selector"]):
        name = _text_or_none(elem, source_config["name_selector"])
        if not name:
            # 名前が取れない要素は採用しない（後段の必須項目チェックで弾かれるため早期に除外）
            continue

        link = elem.select_one("a")
        official_url: str | None = None
        if link and link.get("href"):
            official_url = urljoin(url, link["href"])

        items.append(
            {
                "raw_name": name,
                "raw_address": _text_or_none(elem, source_config["address_selector"]),
                "raw_description": _text_or_none(elem, source_config["description_selector"]),
                "official_url": official_url,
                "image_urls": _collect_image_urls(elem, url),
                "source": source_name,
                "source_url": url,
            }
        )
    return items


def main() -> None:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        sources = yaml.safe_load(f) or []

    all_items: list[dict] = []
    for source in tqdm(sources, desc="Scraping sources"):
        try:
            items = scrape_source(source)
        except Exception as e:
            print(f"error: source={source.get('source_name')} err={e}", file=sys.stderr)
            continue
        all_items.extend(items)
        print(f"ok: {source['source_name']}: {len(items)} items")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(all_items)} items -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
