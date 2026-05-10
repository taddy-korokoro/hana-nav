/**
 * profiles.username に許可するパターン。
 * - 長さ: 3〜30 文字
 * - 文字: 英数字 / 日本語（ひらがな・カタカナ・漢字）/ ハイフン / アンダースコア
 *
 * SNS 連携や Twitter ハンドルのような厳密ルールではなく、見た目で名乗れる程度に緩めるが、
 * 制御文字 / 空白 / 記号類の埋め込みは許さない。表示時に `username_` から始まる初期値を
 * そのまま使うケースもあるため、アンダースコアは許可する。
 */
const USERNAME_PATTERN = /^[A-Za-z0-9_\-぀-ゟ゠-ヿ一-鿿ー]+$/u;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export function validateUsername(input: unknown): { ok: true; value: string } | { ok: false } {
  if (typeof input !== 'string') return { ok: false };
  const trimmed = input.trim();
  if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
    return { ok: false };
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return { ok: false };
  }
  return { ok: true, value: trimmed };
}
