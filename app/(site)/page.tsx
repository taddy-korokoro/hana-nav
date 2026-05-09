import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';

/**
 * トップページのスケルトン。
 * 本実装はチケット 05（トップページ）で行う。ここでは共通レイアウトの動作確認を兼ねた
 * 最小ヒーロー + 主要導線のみ置く。
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-10 pt-12 md:pb-16 md:pt-20">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          Find your bloom
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-6xl">
          満開を、見逃さない。
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
          全国の花畑スポットを、エリア・季節・花の種類から探せます。今が見頃の場所も、来月の予習も。
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/spots"
            className="inline-flex items-center gap-1 rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            スポットを探す
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/identify"
            className="inline-flex items-center gap-1 rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-line-strong"
          >
            AI花判定を試す
          </Link>
        </div>
      </section>
    </div>
  );
}
