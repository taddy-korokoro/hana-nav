import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import { NavLink } from './nav-link';
import { SearchIcon } from './icons';
import { SiteLogo } from './site-logo';
import { UserNavIsland } from './user-nav-island';

/**
 * 全ページ共通ヘッダー（Server Component / cookies 非依存）。
 *
 * - ロゴを左端、ナビとユーザーアクションを右端に配置
 * - PC ではナビ項目 + ユーザーメニューを右肩にまとめる
 * - モバイルでは検索ショートカット（→ /spots）とハンバーガーを右に集約
 *
 * ログイン状態に応じた表示は `<UserNavIsland />`（Client Component）に分離。
 * SiteHeader 自体が cookies を読まないことで、トップ等の公開ページが
 * ISR の対象になる。
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-soft bg-brand-soft">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label={COPY.site.name} className="flex items-center">
          <SiteLogo size="md" />
        </Link>

        <div className="flex items-center gap-6">
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
      </div>
    </header>
  );
}
