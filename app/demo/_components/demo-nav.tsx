import Link from 'next/link';

const SAMPLES = [
  { label: 'トップ', href: '/demo' },
  { label: 'スポット一覧', href: '/demo/spots' },
];

export function DemoNav({ current }: { current: string }) {
  return (
    <div className="border-b border-line bg-brand-soft/30">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-2 text-xs">
        <span className="rounded-pill bg-brand px-2 py-0.5 font-semibold uppercase tracking-wider text-white">
          Demo
        </span>
        <nav className="flex gap-4">
          {SAMPLES.map((s) => {
            const isActive = s.href === current;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={isActive ? 'font-semibold text-brand' : 'text-ink hover:text-brand'}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
        <span className="ml-auto text-faint">設計サンドボックス。本番ルートとは独立</span>
      </div>
    </div>
  );
}
