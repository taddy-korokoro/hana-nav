import type { Metadata } from 'next';
import { IdentifyResult } from '@/components/identify/IdentifyResult';
import { COPY } from '@/lib/constants/copy';

export const metadata: Metadata = {
  title: COPY.identify.result.metaTitle,
  // 判定結果は sessionStorage 経由のクライアント状態なのでクロールさせない。
  robots: { index: false, follow: false },
};

export default function IdentifyResultPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
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
