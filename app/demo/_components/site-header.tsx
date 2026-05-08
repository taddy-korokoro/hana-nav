import Link from 'next/link';
import { MenuIcon, UserIcon } from './icons';

const NAV = [
  { label: 'スポットを探す', href: '/spots' },
  { label: '花から探す', href: '/flowers' },
  { label: 'エリアから探す', href: '/areas' },
  { label: 'AI花判定', href: '/identify' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl font-bold tracking-wider">
          Hana Nav
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink hover:text-ink-muted">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong md:flex"
          >
            <UserIcon className="size-4" />
            ログイン
          </button>
          <button
            type="button"
            aria-label="メニュー"
            className="grid size-10 place-items-center rounded-pill border border-line bg-white md:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
