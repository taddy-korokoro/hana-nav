/**
 * 楽天ウェブサービス共通 fetch ラッパ。
 *
 * - サーバー専用。`RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` / `RAKUTEN_AFFILIATE_ID` は
 *   Server Component / Route Handler / Server Action 以外から触らないこと（CLAUDE.md セキュリティ境界）。
 * - 失敗時は `null` を返す。例外を上に投げない（UI 側が「広告枠を出さない」フォールバックに倒すため）。
 * - キャッシュは fetch 標準の `next: { revalidate, tags }` で制御する。1 秒 1 リクエスト
 *   の楽天側制限に当たらないよう、必ず呼び出し側で revalidate を付ける。
 *
 * 2026-05-14 楽天ウェブサービス API 移行に対応:
 * - 旧ドメイン `app.rakuten.co.jp/services/api` 廃止 → 新ドメイン `openapi.rakuten.co.jp`
 * - 認証パラメータに `accessKey` が必須化（旧来の `applicationId` のみは不可）
 * - endpoint パスは API ごとに prefix が異なるため、呼び出し側で完全パスを渡す
 *   （`ichibams/api/...` / `services/api/...` / `engine/api/...`）
 */

const RAKUTEN_BASE_URL = 'https://openapi.rakuten.co.jp';
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
 * `applicationId` / `accessKey` / `affiliateId` は自動付与する。
 *
 * @param endpoint API ごとの prefix を含む完全な相対パス（先頭 `/` なし）。
 *   例: 'ichibams/api/IchibaItem/Search/20220601'
 * @param params クエリパラメータ（applicationId / accessKey / affiliateId は自動付与のため不要）
 */
export async function rakutenFetch<T>(
  endpoint: string,
  params: Record<string, string | number>,
  options: RakutenFetchOptions,
): Promise<T | null> {
  // env コピペ事故（末尾改行・前後空白）を構造的に潰すため trim する。
  const applicationId = process.env.RAKUTEN_APPLICATION_ID?.trim();
  const accessKey = process.env.RAKUTEN_ACCESS_KEY?.trim();
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID?.trim();

  if (!applicationId || !accessKey) {
    // 「広告枠だけ静かに出ない」フォールバックは維持しつつ、本番でもログは残す。
    // env を設定したつもりでも scope 違い・typo・deploy 再ビルド漏れで読めていない
    // ケースが本番運用で起きるため、Functions ログから即特定できるようにする。
    console.warn(
      '[rakuten] RAKUTEN_APPLICATION_ID or RAKUTEN_ACCESS_KEY is not set. Skipping API call.',
      { endpoint, hasApplicationId: Boolean(applicationId), hasAccessKey: Boolean(accessKey) },
    );
    return null;
  }

  const url = new URL(`${RAKUTEN_BASE_URL}/${endpoint}`);
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
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
      // 400: パラメータ不正（例: 該当なし）、429: レート制限、5xx: 楽天側障害。
      // いずれも UI は「広告枠を出さない」に倒すが、Functions ログには本番でも残す。
      // 本文先頭は楽天 API のエラーメッセージ（error_description 等）を含むため、
      // 切り分けに有用な範囲だけ抜き出す。
      const body = await res.text().catch(() => '');
      console.warn(`[rakuten] ${endpoint} responded ${res.status}`, {
        body: body.slice(0, 300),
      });
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[rakuten] ${endpoint} failed:`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
