import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon, CameraIcon, FlowerIcon, StarIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';

/**
 * AI 花判定（F-05）の訴求セクション。
 * 検索バー下の小さな pill だけだと差別化機能が埋もれるため、ホームに
 * 大きめのバナーカードを置いて `/identify` への流入を増やす。
 * Server Component。データ取得なし。
 */
export function IdentifyPromoSection() {
  const copy = COPY.home.identifyPromo;
  return (
    <section className="pt-10 md:pt-12">
      <div className="overflow-hidden rounded-card-lg border border-line bg-gradient-to-br from-brand-soft via-white to-surface-2">
        <div className="grid gap-10 p-8 md:grid-cols-[1.1fr_1fr] md:gap-12 md:p-12">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-ink-muted md:text-base">
              {copy.description}
            </p>
            <Link
              href="/identify"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <CameraIcon className="size-4" />
              {copy.cta}
              <ArrowRightIcon className="size-4" />
            </Link>
            <p className="mt-3 text-xs text-ink-faint">{copy.note}</p>
          </div>

          <ol className="grid grid-cols-1 gap-3 self-center md:grid-cols-3 md:gap-4">
            <StepCard
              num={1}
              icon={<CameraIcon className="size-6 text-brand" />}
              label={copy.steps[0].label}
              sub={copy.steps[0].sub}
            />
            <StepCard
              num={2}
              icon={<StarIcon className="size-6 text-brand" />}
              label={copy.steps[1].label}
              sub={copy.steps[1].sub}
            />
            <StepCard
              num={3}
              icon={<FlowerIcon className="size-6 text-brand" />}
              label={copy.steps[2].label}
              sub={copy.steps[2].sub}
            />
          </ol>
        </div>
      </div>
    </section>
  );
}

/**
 * モバイルは「アイコン左 + 右側に STEP/ラベル/補足」の横並び帯。
 * デスクトップは `md:contents` で右側の wrapper を解体し、grid 全体の order を組み替えて
 * STEP → アイコン → ラベル → 補足 の縦並びカードに切り替える。
 */
function StepCard({
  num,
  icon,
  label,
  sub,
}: {
  num: number;
  icon: ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <li
      className="
        grid grid-cols-[auto_1fr] items-center gap-4 rounded-card bg-white/80 p-4 shadow-sm
        md:grid-cols-1 md:justify-items-center md:gap-2 md:text-center
      "
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft md:order-2">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5 md:contents">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint md:order-1">
          STEP {num}
        </span>
        <span className="text-sm font-medium leading-snug text-ink md:order-3">{label}</span>
        <span className="text-xs leading-snug text-ink-muted md:order-4 md:text-[11px]">{sub}</span>
      </div>
    </li>
  );
}
