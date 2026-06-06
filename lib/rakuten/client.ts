/**
 * 楽天ウェブサービス共通 HTTP クライアント。
 *
 * - サーバー専用。`RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` / `RAKUTEN_AFFILIATE_ID` は
 *   Server Component / Route Handler / Server Action 以外から触らないこと（CLAUDE.md セキュリティ境界）。
 * - 失敗時は `null` を返す。例外を上に投げない（UI 側が「広告枠を出さない」フォールバックに倒すため）。
 * - キャッシュは `unstable_cache` で revalidate + tags を効かせる。1 秒 1 リクエスト
 *   の楽天側制限に当たらないよう、必ず呼び出し側で revalidate を付ける。
 *
 * 2026-05-14 楽天ウェブサービス API 移行に対応:
 * - 旧ドメイン `app.rakuten.co.jp/services/api` 廃止 → 新ドメイン `openapi.rakuten.co.jp`
 * - 認証パラメータに `accessKey` が必須化（旧来の `applicationId` のみは不可）
 * - endpoint パスは API ごとに prefix が異なるため、呼び出し側で完全パスを渡す
 *   （`ichibams/api/...` / `services/api/...` / `engine/api/...`）
 * - 楽天トラベル API は **Referer ヘッダ必須**（Dashboard の「許可された Web サイト」と照合）
 *
 * ⚠️ なぜ `fetch` でなく `node:https` を使うのか
 * - `Referer` は Fetch 標準で "forbidden header name" に分類されており、`headers: { Referer }`
 *   も `referrer` init オプションも、Next.js の fetch ラッパ + undici の挙動の組み合わせで
 *   silent strip される（PR #61・#62 で実証済み）。
 * - undici の README は「server-side では forbidden 制約を外している」と明言しているが、
 *   Next.js の `globalThis.fetch` 経由ではこの制約が効いてしまう。
 * - `node:https` モジュールを直接使えば、Fetch 標準の制約は適用されず Referer ヘッダが
 *   そのまま outbound HTTP に乗る。組み込みなので追加 dep も不要。
 * - data cache は `unstable_cache` で代替する。
 *
 * 観測性方針: 本番でも request / response の全段にログを残す。
 * 「200 だが Items 0 件」「上位フィルタで全件落ちた」等の死角を埋めるため、
 * 4xx/5xx だけでなく **成功時の Items 件数** と、**0 件成功時はレスポンス本文** も残す。
 * URL は applicationId / accessKey を `***` でマスクしてから出力する。
 */

import { request as httpsRequest } from 'node:https';
import { unstable_cache } from 'next/cache';

const RAKUTEN_BASE_URL = 'https://openapi.rakuten.co.jp';
const DEFAULT_TIMEOUT_MS = 5000;

export type RakutenFetchOptions = {
  /** unstable_cache 用の revalidate 秒数 */
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
  // 楽天 Dashboard の「許可された Web サイト」と一致する URL を Referer として送出する。
  const referer = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (!applicationId || !accessKey) {
    console.warn(
      '[rakuten] RAKUTEN_APPLICATION_ID or RAKUTEN_ACCESS_KEY is not set. Skipping API call.',
      {
        endpoint,
        hasApplicationId: Boolean(applicationId),
        hasAccessKey: Boolean(accessKey),
        applicationIdLen: applicationId?.length ?? 0,
        accessKeyLen: accessKey?.length ?? 0,
      },
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

  // unstable_cache でキャッシュ。キーは endpoint + params の安定化文字列。
  // referer / 認証情報は cache key に含めない（同じ endpoint + params なら同じ結果が返るはず）。
  //
  // 注: `unstable_cache` の公式推奨はモジュールスコープで 1 度だけ定義する形だが、
  // `revalidate` / `tags` を呼び出し側（books は 24h、products は 12h、hotels は 1h）で
  // 動的に差し替えたいので per-call で生成する。現状の Next.js 16 は keyParts ベースの
  // キャッシュ識別のため動作するが、将来「関数の参照同一性」を見る実装に変わったら
  // この方針は再検討（その場合は Map<revalidate+tagsKey, cachedFn> で memoize する）。
  const cached = unstable_cache(
    async () =>
      fetchWithReferer<T>({
        url: url.toString(),
        referer,
        endpoint,
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      }),
    ['rakuten', endpoint, stableStringify(params)],
    {
      revalidate: options.revalidate,
      tags: options.tags,
    },
  );

  return cached();
}

/**
 * `node:https` で直接 GET を発射する。Fetch 標準の forbidden header 制約に
 * 縛られないため `Referer` ヘッダを確実に送出できる。
 */
function fetchWithReferer<T>({
  url,
  referer,
  endpoint,
  timeoutMs,
}: {
  url: string;
  referer: string | undefined;
  endpoint: string;
  timeoutMs: number;
}): Promise<T | null> {
  return new Promise((resolve) => {
    const target = new URL(url);
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (referer) headers.Referer = referer;

    // 送信前ログ。URL から認証情報をマスクして残す。
    console.info(`[rakuten] → ${endpoint}`, {
      url: maskUrl(url),
      referer: referer ?? null,
      headerKeys: Object.keys(headers),
    });

    const req = httpsRequest(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: 'GET',
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          const text = Buffer.concat(chunks).toString('utf8');
          resolve(handleResponse<T>({ status, text, endpoint }));
        });
        res.on('error', (error) => {
          console.warn(`[rakuten] ${endpoint} response stream error:`, error);
          resolve(null);
        });
      },
    );
    req.on('error', (error) => {
      console.warn(`[rakuten] ${endpoint} request error:`, error);
      resolve(null);
    });
    req.on('timeout', () => {
      console.warn(`[rakuten] ${endpoint} timed out after ${timeoutMs}ms`);
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

function handleResponse<T>({
  status,
  text,
  endpoint,
}: {
  status: number;
  text: string;
  endpoint: string;
}): T | null {
  if (status < 200 || status >= 300) {
    console.warn(`[rakuten] ← ${endpoint} ${status}`, {
      body: text.slice(0, 1000),
    });
    return null;
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch (parseError) {
    console.warn(`[rakuten] ← ${endpoint} ${status} (JSON parse failed)`, {
      body: text.slice(0, 1000),
      parseError,
    });
    return null;
  }

  const itemsCount = countItems(data);
  if (itemsCount === 0) {
    console.warn(`[rakuten] ← ${endpoint} ${status} (0 items)`, {
      body: text.slice(0, 1500),
    });
  } else {
    console.info(`[rakuten] ← ${endpoint} ${status} items=${itemsCount}`);
  }

  return data;
}

/**
 * unstable_cache の keyParts に渡すため、`params` をキー順非依存な文字列にシリアライズする。
 * 素の `JSON.stringify(params)` だと挿入順に依存し、呼び出し元の書き方が変わるだけで
 * キャッシュミスが発生し得るため、キーをアルファベット順に並べてから直列化する。
 */
function stableStringify(params: Record<string, string | number>): string {
  const sortedKeys = Object.keys(params).sort();
  return JSON.stringify(sortedKeys.map((key) => [key, params[key]]));
}

/**
 * URL クエリ文字列の applicationId / accessKey / affiliateId を `***` でマスクする。
 * ログ出力時に認証情報を漏らさないため。
 */
function maskUrl(url: string): string {
  return url
    .replace(/applicationId=[^&]+/, 'applicationId=***')
    .replace(/accessKey=[^&]+/, 'accessKey=***')
    .replace(/affiliateId=[^&]+/, 'affiliateId=***');
}

/**
 * 各 API のレスポンス形を吸収して「中身の件数」を返す。
 * - 楽天市場 / ブックス: `Items: [...]`
 * - 楽天トラベル: `hotels: [...]`
 * 該当キーが無ければ `null`（=不明）を返し、ログで「件数不明」と表示できるようにする。
 */
function countItems(data: unknown): number | null {
  if (typeof data !== 'object' || data === null) return null;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.Items)) return obj.Items.length;
  if (Array.isArray(obj.hotels)) return obj.hotels.length;
  return null;
}
