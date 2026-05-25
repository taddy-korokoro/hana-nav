'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';

/**
 * `/mypage/profile` のエラー境界。プロフィール取得失敗や Server Action 例外を捕捉する。
 */
export default function MyProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[/mypage/profile] error boundary caught', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 text-center">
      <h1 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
        プロフィールを読み込めませんでした
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-muted">
        通信エラーまたはサーバーの一時的な不調が考えられます。再読み込みでも改善しない場合はお問い合わせください。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          {COPY.error.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href="/mypage">{COPY.mypage.profile.backToMypage}</Link>
        </Button>
      </div>
    </main>
  );
}
