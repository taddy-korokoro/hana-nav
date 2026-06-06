import type { Metadata } from 'next';
import { IdentifyUploader } from '@/components/identify/IdentifyUploader';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';

// IdentifyUploader は Client Component。Server 側は静的シェルだが、
// 共通レイアウトの cookies 読みを許容するため disableValidation を付ける。
export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

export const metadata: Metadata = {
  title: COPY.identify.metaTitle,
  description: COPY.identify.metaDescription,
};

export default function IdentifyPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <Breadcrumb
          className="mb-4"
          items={[{ label: COPY.nav.labels.home, href: '/' }, { label: COPY.nav.labels.identify }]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.identify.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {COPY.identify.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
          {COPY.identify.description}
        </p>
      </section>

      <div className="max-w-3xl">
        <IdentifyUploader />
      </div>
    </div>
  );
}
