/**
 * レビュー投稿 / 編集リクエストの正規化。POST / PATCH の両方で使う。
 *
 * 受け取った unknown を {spotId, rating, comment, visitedAt} に変換し、
 * 範囲外・空文字・型不一致は `code` で識別できる結果に倒して返す。
 * NG ワードの検出は `lib/ng-words.ts` の責務で、ここでは扱わない。
 */

export type ReviewCode =
  | 'invalid_spot_id'
  | 'invalid_rating'
  | 'invalid_comment'
  | 'invalid_visited_at';

export type ParsedReview = {
  /** PATCH で `requireSpotId=false` を渡した場合は空文字 */
  spotId: string;
  rating: number;
  comment: string | null;
  visitedAt: string | null;
};

export type ParseResult = { ok: true; value: ParsedReview } | { ok: false; code: ReviewCode };

export function parseReviewBody(body: unknown, options?: { requireSpotId?: boolean }): ParseResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, code: 'invalid_spot_id' };
  }
  const obj = body as Record<string, unknown>;
  const requireSpotId = options?.requireSpotId ?? true;

  const spotIdRaw = obj['spot_id'];
  let spotId = '';
  if (requireSpotId) {
    if (typeof spotIdRaw !== 'string' || spotIdRaw.length === 0) {
      return { ok: false, code: 'invalid_spot_id' };
    }
    spotId = spotIdRaw;
  }

  const ratingRaw = obj['rating'];
  if (
    typeof ratingRaw !== 'number' ||
    !Number.isInteger(ratingRaw) ||
    ratingRaw < 1 ||
    ratingRaw > 5
  ) {
    return { ok: false, code: 'invalid_rating' };
  }

  const commentRaw = obj['comment'];
  let comment: string | null = null;
  if (typeof commentRaw === 'string') {
    const trimmed = commentRaw.trim();
    if (trimmed.length > 200) {
      return { ok: false, code: 'invalid_comment' };
    }
    comment = trimmed.length === 0 ? null : trimmed;
  } else if (commentRaw != null) {
    return { ok: false, code: 'invalid_comment' };
  }

  const visitedRaw = obj['visited_at'];
  let visitedAt: string | null = null;
  if (typeof visitedRaw === 'string' && visitedRaw.length > 0) {
    // YYYY-MM-DD のみ許容。Date でパースして実在日付チェック。
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitedRaw)) {
      return { ok: false, code: 'invalid_visited_at' };
    }
    const d = new Date(visitedRaw);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, code: 'invalid_visited_at' };
    }
    // 訪問日に未来日（今日より後）は意味的に不自然なので弾く。
    // 文字列比較で十分（YYYY-MM-DD は辞書順 = 時系列順）。
    const today = new Date().toISOString().slice(0, 10);
    if (visitedRaw > today) {
      return { ok: false, code: 'invalid_visited_at' };
    }
    visitedAt = visitedRaw;
  } else if (visitedRaw != null && visitedRaw !== '') {
    return { ok: false, code: 'invalid_visited_at' };
  }

  return { ok: true, value: { spotId, rating: ratingRaw, comment, visitedAt } };
}
