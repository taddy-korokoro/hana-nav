import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { SiteLogo } from '@/components/layout/site-logo';
import { COPY } from '@/lib/constants/copy';

export default function FlowerDetailNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 text-center">
      <div className="flex justify-center">
        <SiteLogo size="2xl" variant="error" />
      </div>
      <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight md:text-4xl">
        {COPY.flowerDetailNotFound.title}
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-muted">
        {COPY.flowerDetailNotFound.description}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/flowers"
          className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          {COPY.flowerDetailNotFound.backToList}
          <ArrowRightIcon className="size-4" />
        </Link>
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
