import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';

type Props = {
  authenticated: boolean;
  used: number;
  limit: number;
  remaining: number;
};

/**
 * AI 判定の残回数バナー。残 0 / 1 / それ以外で文言と背景を切り替える。
 * 状態は親（IdentifyUploader）が管理し、ここは純粋な表示。
 */
export function RateLimitBanner({ authenticated, used, limit, remaining }: Props) {
  const reached = remaining <= 0 && limit > 0;

  return (
    <div
      className={`rounded-card border p-4 text-sm ${
        reached ? 'border-rose-200 bg-rose-50' : 'border-line bg-white'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
        {authenticated ? COPY.identify.rateLimit.authHeading : COPY.identify.rateLimit.anonHeading}
      </p>
      <p className="mt-1 font-serif text-base font-bold">
        {COPY.identify.rateLimit.remaining(remaining, limit)}
      </p>
      {reached ? (
        <div className="mt-2 space-y-1 text-ink-muted">
          <p className="font-medium text-ink">{COPY.identify.rateLimit.reachedTitle}</p>
          <p>
            {authenticated
              ? COPY.identify.rateLimit.reachedDescriptionAuth
              : COPY.identify.rateLimit.reachedDescriptionAnon}
          </p>
          {!authenticated && (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 pt-1 text-brand underline-offset-4 hover:underline"
            >
              {COPY.identify.rateLimit.loginCta}
            </Link>
          )}
        </div>
      ) : !authenticated && used > 0 ? (
        <p className="mt-2 text-ink-muted">{COPY.identify.rateLimit.anonHint}</p>
      ) : null}
    </div>
  );
}
