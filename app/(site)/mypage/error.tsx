'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';

/**
 * `/mypage` トップのエラー境界。プロフィール取得や統計取得の例外をここで捕捉する。
 */
export default function MypageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[/mypage] error boundary caught', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 text-center">
      <h1 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
        マイページの読み込みに失敗しました
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-muted">
        しばらく時間を置いてから再度お試しください。問題が続く場合はお問い合わせください。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          {COPY.error.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{COPY.common.backToTop}</Link>
        </Button>
      </div>
    </main>
  );
}
