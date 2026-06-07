import { COPY } from '@/lib/constants/copy';
import { tokyoYmd } from '@/lib/utils/dateUtils';

export function HeroSection({ currentMonth }: { currentMonth: number }) {
  const monthEn = COPY.common.months.en[currentMonth] ?? '';
  const monthLine = COPY.home.hero.monthLine(monthEn, tokyoYmd().year);
  return (
    <section className="pb-2 pt-12 md:pb-4 md:pt-20">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{monthLine}</p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-6xl">
        {COPY.home.hero.title}
      </h1>
      <p className="mt-4 max-w-4xl text-base leading-7 text-ink-muted">
        {COPY.home.hero.description}
      </p>
    </section>
  );
}
