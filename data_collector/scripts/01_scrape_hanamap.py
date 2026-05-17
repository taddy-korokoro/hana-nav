"""hanamap.com 専用 3 段スクレイパ。

階層:
  /flower/area/                              → 47 都道府県のエントリーポイント
  /flower/area/{prefecture_path}/            → スポット一覧（ページネーション）
  /flower/area/{prefecture_path}/entry-N.html → スポット詳細

実装方針:
- robots.txt 確認 + 2 秒スリープ + User-Agent: HanaNavBot は既存 01_scrape.py と同じ作法
- hanamap には住所が記載されていない → raw_address は null で出す。03_geocode.py が
  Places API で name + prefecture_hint から住所/座標を解決する
- 都道府県名（日本語）は詳細ページの <dt>都道府県</dt><dd>...</dd> から取得
- 既存パイプラインと互換の output/raw_data.json を出力（02 以降はそのまま使える）

設定: config/hanamap.yaml
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
import yaml
from bs4 import BeautifulSoup
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "hanamap.yaml"
OUTPUT_PATH = ROOT / "output" / "raw_data.json"

USER_AGENT = "HanaNavBot/1.0 (+https://hananav.example.com/bot)"
REQUEST_TIMEOUT_SEC = 10
MAX_IMAGES_PER_ITEM = 5
SOURCE_NAME = "hanamap"

# hanamap が画像配信に使うパス。サイト共通のロゴ等を除外したい
MEDIA_PATH_HINT = "/media/"


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


def _normalize_path(path: str) -> str:
    return path if path.endswith("/") else f"{path}/"


def collect_prefecture_paths(base_url: str, area_index_path: str, sleep_sec: float) -> list[str]:
    """area_index_path から 47 都道府県の相対パスを抽出する。"""
    index_url = urljoin(base_url, area_index_path)
    soup = fetch(index_url, sleep_sec)
    if not soup:
        return []
    paths: list[str] = []
    seen: set[str] = set()
    index_normalized = _normalize_path(area_index_path)
    for a in soup.select('h3 > a[href*="/flower/area/"]'):
        href = a.get("href")
        if not href:
            continue
        absolute = urljoin(index_url, href)
        path = _normalize_path(urlparse(absolute).path)
        if path == index_normalized:
            continue
        if path in seen:
            continue
        seen.add(path)
        paths.append(path)
    return paths


def collect_entry_urls(
    base_url: str,
    prefecture_path: str,
    sleep_sec: float,
    max_entries: int | None,
    max_pages: int,
) -> list[str]:
    """都道府県別一覧から entry-N.html を全ページ巡回して取得する。

    自身のエリア配下に属するリンクだけ採用（関連スポットの cross-prefecture リンクを除外）。
    """
    prefecture_path = _normalize_path(prefecture_path)
    urls: list[str] = []
    seen: set[str] = set()
    page = 1
    while page <= max_pages:
        if page == 1:
            page_url = urljoin(base_url, prefecture_path)
        else:
            page_url = urljoin(base_url, f"{prefecture_path}page/{page}/")
        soup = fetch(page_url, sleep_sec)
        if not soup:
            break
        found_on_page = 0
        for a in soup.select('a[href*="entry-"][href$=".html"]'):
            href = a.get("href")
            if not href:
                continue
            absolute = urljoin(page_url, href)
            absolute_path = urlparse(absolute).path
            # 関連スポット枠の cross-prefecture リンクを弾く
            if not absolute_path.startswith(prefecture_path):
                continue
            if absolute in seen:
                continue
            seen.add(absolute)
            urls.append(absolute)
            found_on_page += 1
            if max_entries and len(urls) >= max_entries:
                return urls
        if found_on_page == 0:
            break
        page += 1
    if page > max_pages:
        print(f"warn: max_pages 到達 path={prefecture_path}", file=sys.stderr)
    return urls


def _detail_dt_dd(soup: BeautifulSoup, label: str) -> str | None:
    """<dt>{label}</dt><dd>...</dd> 形式から値を取り出す。"""
    for dt in soup.select("dt"):
        if dt.get_text(strip=True) == label:
            dd = dt.find_next_sibling("dd")
            if dd:
                value = dd.get_text(strip=True)
                return value or None
    return None


def _is_hiragana_only(text: str) -> bool:
    return bool(text) and all(("぀" <= c <= "ゟ") or c in "ー 　" for c in text)


# 公式 URL 検出時に除外したい外部リンク先（hanamap の詳細ページには「画像検索はこちら」
# として Google 検索のリンクが混入するため）
SEARCH_ENGINE_HOST_HINTS = (
    "google.com",
    "google.co.jp",
    "bing.com",
    "search.yahoo",
    "duckduckgo.com",
)


def _first_external_link(soup: BeautifulSoup, host: str) -> str | None:
    for a in soup.select("a[href^=http]"):
        href = a.get("href", "")
        if not href.startswith("http"):
            continue
        if host in href:
            continue
        if any(hint in href for hint in SEARCH_ENGINE_HOST_HINTS):
            continue
        return href
    return None


def fetch_entry_detail(entry_url: str, sleep_sec: float) -> dict | None:
    soup = fetch(entry_url, sleep_sec)
    if not soup:
        return None

    h1 = soup.select_one("h1")
    name = h1.get_text(strip=True) if h1 else None
    if not name:
        print(f"warn: 名称取れず entry={entry_url}", file=sys.stderr)
        return None

    # ふりがな: h1 直下の p。ひらがなのみの場合だけ採用（混入を避ける）
    name_kana: str | None = None
    nxt = h1.find_next_sibling("p") if h1 else None
    if nxt:
        text = nxt.get_text(strip=True)
        if _is_hiragana_only(text):
            name_kana = text

    prefecture_hint = _detail_dt_dd(soup, "都道府県")
    if not prefecture_hint:
        print(f"warn: 都道府県取れず entry={entry_url}", file=sys.stderr)

    # 花タグ: a.tag のテキスト。地域タグ（北海道地方 等）は除外
    flower_tags: list[str] = []
    for a in soup.select("a.tag"):
        text = a.get_text(strip=True)
        if not text:
            continue
        if text.endswith("地方") or text == prefecture_hint:
            continue
        flower_tags.append(text)

    # メイン記事のコンテナを起点にする。ヘッダーのロゴ・フッター・関連スポット枠を一括除外できる
    # hanamap の詳細ページは <article class="entry"> がメイン記事を包む構造
    main_article = soup.select_one("article.entry") or soup

    # 説明: 30 文字以上の最初の p（ふりがな以外）。詳細な構造は WebFetch の所見に基づく
    description: str | None = None
    for p in main_article.select("p"):
        text = p.get_text(strip=True)
        if text == name_kana:
            continue
        if len(text) >= 30:
            description = text
            break

    official_url = _first_external_link(main_article, host=urlparse(entry_url).netloc)

    # 画像 URL: メイン記事配下の img のみ。src を絶対化。/media/ パスのみ採用して念のためロゴ等を二重除外
    image_urls: list[str] = []
    for img in main_article.select("img"):
        src = img.get("src")
        if not src:
            continue
        absolute = urljoin(entry_url, src)
        if MEDIA_PATH_HINT not in absolute:
            continue
        if absolute in image_urls:
            continue
        image_urls.append(absolute)
        if len(image_urls) >= MAX_IMAGES_PER_ITEM:
            break

    return {
        "raw_name": name,
        "raw_name_kana": name_kana,
        "raw_address": None,  # hanamap に住所欄なし → 03_geocode の Places API で解決
        "raw_description": description,
        "official_url": official_url,
        "image_urls": image_urls,
        "source": SOURCE_NAME,
        "source_url": entry_url,
        "prefecture_hint": prefecture_hint,
        "flower_tags": flower_tags,
    }


def main() -> None:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

    base_url: str = config["base_url"]
    area_index_path: str = config.get("area_index_path", "/flower/area/")
    target_paths: list[str] = config.get("target_prefecture_paths") or []
    max_entries = config.get("max_entries_per_prefecture")
    sleep_sec = float(config.get("sleep_sec", 2.0))
    max_pages = int(config.get("max_pages_per_prefecture", 20))

    if not can_fetch(urljoin(base_url, area_index_path)):
        print(f"error: robots.txt で拒否 url={base_url}", file=sys.stderr)
        return

    if target_paths:
        prefecture_paths = [_normalize_path(p) for p in target_paths]
        print(f"info: 設定で指定された {len(prefecture_paths)} 都道府県を巡回")
    else:
        prefecture_paths = collect_prefecture_paths(base_url, area_index_path, sleep_sec)
        print(f"info: area_index から {len(prefecture_paths)} 都道府県を自動取得")

    all_items: list[dict] = []
    for pref_path in tqdm(prefecture_paths, desc="Prefectures"):
        entry_urls = collect_entry_urls(base_url, pref_path, sleep_sec, max_entries, max_pages)
        print(f"info: {pref_path} entries={len(entry_urls)}")
        for entry_url in tqdm(entry_urls, desc=pref_path, leave=False):
            item = fetch_entry_detail(entry_url, sleep_sec)
            if item:
                all_items.append(item)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(all_items)} items -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
