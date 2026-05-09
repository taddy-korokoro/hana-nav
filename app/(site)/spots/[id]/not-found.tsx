import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';

export default function SpotDetailNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">404</p>
      <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight md:text-4xl">
        スポットが見つかりませんでした
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-muted">
        リンクが古くなっているか、公開が停止された可能性があります。
        最新のスポット一覧から探してみてください。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/spots"
          className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          スポット一覧へ
          <ArrowRightIcon className="size-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-line-strong"
        >
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
