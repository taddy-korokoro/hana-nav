/**
 * レビュー本文の簡易 NG ワードフィルタ。
 *
 * 完璧な検知は目指さず、明白な誹謗中傷・差別・性的表現を弾く一次フィルタ。すり抜けた投稿は
 * 管理者画面から手動論理削除する運用（specs/operations.md）。バージョンは辞書を更新したら
 * インクリメントし、`ai_usage_logs` 等とは別に reviews 側で必要になったときに記録できるよう
 * Export しておく。
 *
 * 検知ロジックはパフォーマンス優先で小文字化 + 部分一致のみ。日本語・英語の代表的な単語を
 * 列挙する。完全一致や前後の単語境界は見ない（ローマ字変換などをすり抜け対策する程度の意味）。
 */

export const NG_WORDS_VERSION = 1;

/**
 * 検知対象の語。小文字で揃えて部分一致する。
 *
 * - 増減した場合は NG_WORDS_VERSION をインクリメントする。
 * - 例示用に最小限の代表語のみ。実運用で必要になったら都度追加する。
 */
const NG_WORDS: readonly string[] = [
  // 誹謗中傷（罵倒・蔑称の代表）
  '死ね',
  'しね',
  '殺す',
  'ころす',
  'うざい',
  'きもい',
  'きしょい',
  'ばか',
  'アホ',
  'クズ',
  'ゴミ',
  // 差別語（社会的に問題視される代表語）
  'こじき',
  '害児',
  // 性的表現の代表
  'セックス',
  'sex',
  // 英語の代表的な侮蔑語
  'fuck',
  'shit',
  'bitch',
] as const;

export function containsNgWord(text: string): boolean {
  if (typeof text !== 'string' || text.length === 0) return false;
  const normalized = text.toLowerCase();
  return NG_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}
