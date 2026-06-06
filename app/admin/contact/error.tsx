'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';

/**
 * `/admin/contact` 配下のエラー境界。
 *
 * `lib/queries/contact.ts` が Supabase エラーを throw するように変更した
 * 結果、管理画面のクエリ失敗を可視的に拾える場所が必要。CLAUDE.md「データ
 * 取得エラーは error.tsx で境界を作る。try/catch で握りつぶして空配列を
 * 返す実装はしない（管理画面では特に）」に準拠。
 */
export default function AdminContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[/admin/contact] error boundary caught', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 text-center">
      <h1 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
        お問い合わせ管理の読み込みに失敗しました
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-muted">
        しばらく時間を置いてから再度お試しください。問題が続く場合は Supabase
        の状態を確認してください。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          {COPY.error.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">管理ホームへ</Link>
        </Button>
      </div>
    </main>
  );
}
