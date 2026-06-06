import type { Metadata } from 'next';
import { IdentifyResult } from '@/components/identify/IdentifyResult';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';

// IdentifyResult は sessionStorage を読む Client Component。Server 側は静的シェルだが、
// 共通レイアウトの cookies 読みを許容するため disableValidation を付ける。
export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

export const metadata: Metadata = {
  title: COPY.identify.result.metaTitle,
  // 判定結果は sessionStorage 経由のクライアント状態なのでクロールさせない。
  robots: { index: false, follow: false },
};

export default function IdentifyResultPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.nav.labels.identify, href: '/identify' },
            { label: COPY.identify.result.title },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.identify.result.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {COPY.identify.result.title}
        </h1>
      </section>

      <IdentifyResult />
    </div>
  );
}
