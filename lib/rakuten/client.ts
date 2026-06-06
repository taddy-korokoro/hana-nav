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
 *
 * 観測性方針: 本番でも request / response の全段にログを残す。
 * 「200 だが Items 0 件」「上位フィルタで全件落ちた」等の死角を埋めるため、
 * 4xx/5xx だけでなく **成功時の Items 件数** と、**0 件成功時はレスポンス本文** も残す。
 * URL は applicationId / accessKey を `***` でマスクしてから出力する。
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
  // 楽天トラベル API は Referer ヘッダ必須で、未送出時は
  // 403 REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING が返る。
  // 楽天 Dashboard の「許可された Web サイト」と一致させるため
  // 本番 URL（hananav.site）を Referer として明示する。Books / Ichiba には
  // 無害なので endpoint で分岐せず常に付与。
  //
  // ⚠️ `Referer` は Fetch 標準で "forbidden header name" に分類されており、
  // `headers: { Referer }` を渡しても undici は silent strip して送出しない。
  // 必ず `RequestInit.referrer` を使う。
  const referrer = process.env.NEXT_PUBLIC_BASE_URL?.trim();

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

  // 送信前ログ。URL から認証情報をマスクして残す。
  console.info(`[rakuten] → ${endpoint}`, {
    url: maskUrl(url.toString()),
    referrer: referrer ?? null,
    params,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      // referrerPolicy: 'unsafe-url' でクロスオリジン宛にも完全 URL を送出。
      // referrer 自体は origin のみ（https://hananav.site）なので機密漏えいの問題は無い。
      ...(referrer ? { referrer, referrerPolicy: 'unsafe-url' as const } : {}),
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
      console.warn(`[rakuten] ← ${endpoint} ${res.status}`, {
        body: body.slice(0, 1000),
      });
      return null;
    }

    // 200 だが Items が 0 件の場合のために、一度 text で読んで件数を確認してから JSON.parse する。
    // hits=4-5 の小さいレスポンスなので二重 parse のコストは無視できる。
    const text = await res.text();
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch (parseError) {
      console.warn(`[rakuten] ← ${endpoint} ${res.status} (JSON parse failed)`, {
        body: text.slice(0, 1000),
        parseError,
      });
      return null;
    }

    const itemsCount = countItems(data);
    if (itemsCount === 0) {
      // 0 件成功は「該当なし」かもしれないし「我々のクエリが間違っている」かもしれない。
      // 切り分けのため body を残す（hits 上限を絞っているのでサイズは小さい）。
      console.warn(`[rakuten] ← ${endpoint} 200 (0 items)`, {
        body: text.slice(0, 1500),
      });
    } else {
      console.info(`[rakuten] ← ${endpoint} 200 items=${itemsCount}`);
    }

    return data;
  } catch (error) {
    console.warn(`[rakuten] ${endpoint} failed:`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
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
