import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';

export const metadata: Metadata = {
  title: COPY.contact.thanks.metaTitle,
  // 受付完了ページはインデックスさせない。問い合わせ ID が URL に出るため。
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ id?: string }>;

export default function ContactThanksPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:pt-12">
      <header className="pb-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.contact.title, href: '/contact' },
            { label: COPY.contact.thanks.title },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.contact.thanks.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {COPY.contact.thanks.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">{COPY.contact.thanks.description}</p>
      </header>

      {/* id は searchParams で渡る動的データ。cacheComponents 有効下で prerender を
          拒否されないよう Suspense でガードする。 */}
      <Suspense fallback={null}>
        <ContactReferenceId searchParams={searchParams} />
      </Suspense>

      <div className="mt-8">
        <Button asChild>
          <Link href="/">{COPY.contact.thanks.backToTop}</Link>
        </Button>
      </div>
    </section>
  );
}

async function ContactReferenceId({ searchParams }: { searchParams: SearchParams }) {
  const { id } = await searchParams;
  if (!id) return null;
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {COPY.contact.thanks.referenceLabel}
      </p>
      <p className="mt-2 break-all font-mono text-sm text-ink">{id}</p>
    </div>
  );
}
