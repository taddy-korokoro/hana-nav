import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import { NavLink } from './nav-link';
import { SearchIcon } from './icons';
import { SiteLogo } from './site-logo';
import { UserNavIsland } from './user-nav-island';

/**
 * 全ページ共通ヘッダー（Server Component / cookies 非依存）。
 *
 * ログイン状態に応じた表示は `<UserNavIsland />`（Client Component）に分離。
 * SiteHeader 自体が cookies を読まないことで、トップ等の公開ページが
 * ISR の対象になる。
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label={COPY.site.name} className="flex items-center">
          <SiteLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {COPY.nav.items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-ink transition hover:text-brand"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form
          action="/spots"
          method="get"
          role="search"
          className="hidden items-center gap-2 rounded-pill border border-line bg-white pl-3 pr-1 py-1 transition focus-within:border-line-strong md:flex"
        >
          <SearchIcon className="size-4 text-ink-muted" aria-hidden />
          <label className="sr-only" htmlFor="header-search">
            {COPY.nav.quickSearch}
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            placeholder={COPY.nav.headerSearchPlaceholder}
            className="w-44 bg-transparent py-1 text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white transition hover:bg-ink/90"
          >
            {COPY.common.search}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/spots"
            aria-label={COPY.nav.quickSearch}
            className="grid size-10 place-items-center rounded-pill border border-line bg-white text-ink-muted transition hover:border-line-strong hover:text-ink md:hidden"
          >
            <SearchIcon className="size-5" />
          </Link>

          <UserNavIsland />
        </div>
      </div>
    </header>
  );
}
