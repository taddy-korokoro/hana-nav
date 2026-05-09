import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MobileNav } from './mobile-nav';
import { NavLink } from './nav-link';
import { NAV_ITEMS } from './nav-items';
import { SearchIcon } from './icons';
import { UserMenu } from './user-menu';

/**
 * 全ページ共通ヘッダー（Server Component）。
 * Supabase からログイン状態と role を取得し、未ログインなら ログイン/会員登録 を、
 * ログイン済なら UserMenu を表示する。
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, role')
      .eq('id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.role === 'admin';
  }

  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-xl font-bold tracking-wider">
          hana nav
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV_ITEMS.map((item) => (
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
            スポットを検索
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            placeholder="キーワード検索"
            className="w-44 bg-transparent py-1 text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white transition hover:bg-ink/90"
          >
            検索
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/spots"
            aria-label="スポットを検索"
            className="grid size-10 place-items-center rounded-pill border border-line bg-white text-ink-muted transition hover:border-line-strong hover:text-ink md:hidden"
          >
            <SearchIcon className="size-5" />
          </Link>

          {user ? (
            <div className="hidden md:block">
              <UserMenu
                email={user.email ?? ''}
                username={username}
                avatarUrl={avatarUrl}
                isAdmin={isAdmin}
              />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/auth/login"
                className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                会員登録
              </Link>
            </div>
          )}

          <MobileNav isLoggedIn={!!user} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
