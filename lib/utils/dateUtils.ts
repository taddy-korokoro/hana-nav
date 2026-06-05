/**
 * JST（Asia/Tokyo）基準の日付ヘルパー。
 *
 * Vercel Functions の Node ランタイムは `TZ` 環境変数が予約済みで UTC 固定のため、
 * `new Date().getMonth()` や `new Date().setHours(0)` をそのまま使うと
 * 本番では JST と 9 時間ずれる。日境界・月境界が絡む判定は必ずこのモジュール
 * のヘルパーを経由すること。
 *
 * DB 側のカラムはすべて TIMESTAMPTZ（UTC 保管）なので、SQL の比較値は UTC ISO 文字列を渡す。
 *
 * 引数なし呼び出し（= 現在時刻基準）は `React.cache` でリクエスト単位に memoize する。
 * 同一リクエスト内で複数の Server Component から呼ばれても結果がブレない
 * （深夜 0 時跨ぎで Suspense 兄弟間に月ズレが出る等を構造的に防ぐ）。
 */

import { cache } from 'react';

const JST_TZ = 'Asia/Tokyo';

type TokyoYmd = { year: number; month: number; day: number };

function tokyoParts(date: Date): TokyoYmd {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: JST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * 現在時刻（now）から JST 年月日を返す。React.cache でリクエスト単位に memoize。
 * 明示的な Date を渡すケースは memoize から外す（テストや過去日付計算で意図せず
 * 共有されないように）。
 */
const tokyoYmdNow = cache((): TokyoYmd => tokyoParts(new Date()));

/** JST の月（1-12）を返す。月またぎ見頃判定で使う。 */
export function tokyoMonth(date?: Date): number {
  return (date ? tokyoParts(date) : tokyoYmdNow()).month;
}

/** JST の年月日を `{ year, month, day }` で返す。 */
export function tokyoYmd(date?: Date): TokyoYmd {
  return date ? tokyoParts(date) : tokyoYmdNow();
}

/** JST の "YYYY-MM-DD" 文字列を返す。 */
export function tokyoDateString(date?: Date): string {
  const { year, month, day } = date ? tokyoParts(date) : tokyoYmdNow();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** JST の今日 00:00 を UTC ISO 文字列で返す。SQL の `gte('used_at', ...)` 等に渡す。 */
export function tokyoTodayStartIso(date?: Date): string {
  const { year, month, day } = date ? tokyoParts(date) : tokyoYmdNow();
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return new Date(`${year}-${m}-${d}T00:00:00+09:00`).toISOString();
}

/** JST の今月 1 日 00:00 を UTC ISO 文字列で返す。月次集計の下限に使う。 */
export function tokyoMonthStartIso(date?: Date): string {
  const { year, month } = date ? tokyoParts(date) : tokyoYmdNow();
  const m = String(month).padStart(2, '0');
  return new Date(`${year}-${m}-01T00:00:00+09:00`).toISOString();
}
