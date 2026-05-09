const MONTH_LABELS = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function HeroSection({ currentMonth }: { currentMonth: number }) {
  const monthLabel = `${MONTH_LABELS[currentMonth] ?? ''} ${new Date().getFullYear()}`;
  return (
    <section className="pb-10 pt-12 md:pb-16 md:pt-20">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
        {monthLabel} ・ Find your bloom
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-6xl">
        満開を、見逃さない。
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
        全国の花畑スポットを、エリア・季節・花の種類から探せます。今が見頃の場所も、来月の予習も。
      </p>
    </section>
  );
}
