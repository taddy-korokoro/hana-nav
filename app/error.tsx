'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { COPY } from '@/lib/constants/copy';

/**
 * ルート全体のエラー境界。個別セグメントの error.tsx が無いページ（トップ・
 * 一覧系・identify 系など）で予期しないエラーが発生した場合のフォールバック。
 * Next.js の error.tsx は Client Component 必須。root layout は生きているので
 * SiteHeader / SiteFooter は通常通り描画され、main 部分だけがこの UI に置き換わる。
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root] error boundary caught', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 text-center">
      <h1 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
        {COPY.error.generic.title}
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-muted">{COPY.error.generic.description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          {COPY.error.retry}
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-line-strong"
        >
          {COPY.common.backToTop}
        </Link>
      </div>
    </main>
  );
}
