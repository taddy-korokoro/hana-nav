/**
 * 楽天ウェブサービス共通 fetch ラッパ。
 *
 * - サーバー専用。`RAKUTEN_APPLICATION_ID` / `RAKUTEN_AFFILIATE_ID` は Server Component /
 *   Route Handler / Server Action 以外から触らないこと（CLAUDE.md セキュリティ境界）。
 * - 失敗時は `null` を返す。例外を上に投げない（UI 側が「広告枠を出さない」フォールバックに倒すため）。
 * - キャッシュは fetch 標準の `next: { revalidate, tags }` で制御する。1 秒 1 リクエスト
 *   の楽天側制限に当たらないよう、必ず呼び出し側で revalidate を付ける。
 */

const RAKUTEN_BASE_URL = 'https://app.rakuten.co.jp/services/api';
const DEFAULT_TIMEOUT_MS = 5000;

export type RakutenFetchOptions = {
  /** fetch のキャッシュ用 revalidate 秒数 */
  revalidate: number;
  /** キャッシュタグ（管理画面からの手動 revalidate 用に切る） */
  tags?: string[];
  /** タイムアウト（ms）。デフォルト 5 秒 */
  timeoutMs?: number;
};

/**
 * 楽天ウェブサービスの GET エンドポイントを叩く。
 * `applicationId` と `affiliateId` は自動付与する。
 *
 * @param endpoint 例: 'BooksTotalSearch/20170404'
 * @param params クエリパラメータ（applicationId / affiliateId は自動付与のため不要）
 */
export async function rakutenFetch<T>(
  endpoint: string,
  params: Record<string, string | number>,
  options: RakutenFetchOptions,
): Promise<T | null> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!applicationId) {
    // 開発初期や Vercel 環境変数未設定時に「広告枠だけ静かに出ない」状態にする。
    // エラー扱いするとページ全体が落ちるので、ログだけ残す。
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[rakuten] RAKUTEN_APPLICATION_ID is not set. Skipping API call.');
    }
    return null;
  }

  const url = new URL(`${RAKUTEN_BASE_URL}/${endpoint}`);
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('format', 'json');
  if (affiliateId) {
    url.searchParams.set('affiliateId', affiliateId);
  }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      next: {
        revalidate: options.revalidate,
        tags: options.tags,
      },
    });

    if (!res.ok) {
      // 400: パラメータ不正（例: 該当なし）、429: レート制限、5xx: 楽天側障害
      // いずれも UI 側で「広告枠を出さない」に倒したいので null 返却で吸収する。
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[rakuten] ${endpoint} responded ${res.status}`);
      }
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[rakuten] ${endpoint} failed:`, error);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
