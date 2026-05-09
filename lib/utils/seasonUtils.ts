/**
 * 月またぎを含む見頃判定。
 * `start <= end` の場合は通常の範囲、`start > end`（例: 12〜2 月の梅）は年をまたぐ範囲とみなす。
 */
export function isInBestSeason(start: number, end: number, currentMonth: number): boolean {
  if (start <= end) {
    return currentMonth >= start && currentMonth <= end;
  }
  return currentMonth >= start || currentMonth <= end;
}

export function formatSeasonRange(start: number | null, end: number | null): string {
  if (start == null || end == null) return '';
  if (start === end) return `${start}月`;
  return `${start}月〜${end}月`;
}
