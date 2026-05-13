'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/auth/logout/actions';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { COPY } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';
import {
  BookmarkIcon,
  CameraIcon,
  FlowerIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from './icons';
import { SiteLogo } from './site-logo';

/**
 * ハンバーガーメニュー内の各ナビ項目の左に置く専用アイコン。NAV_ITEMS は
 * copy.ts 側でアイコンを持たないため、href をキーに mobile-nav 側でマップする。
 */
const NAV_ITEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '/spots': SearchIcon,
  '/flowers': FlowerIcon,
  '/identify': CameraIcon,
};

type MobileNavProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

export function MobileNav({ isLoggedIn, isAdmin }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        aria-label={COPY.nav.openMenu}
        className="grid size-10 place-items-center rounded-pill border border-line bg-white md:hidden"
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 max-w-[85vw] bg-surface">
        <SheetHeader>
          <SheetTitle className="sr-only">{COPY.site.name}</SheetTitle>
          <SheetDescription className="sr-only">{COPY.nav.siteMenu}</SheetDescription>
          <SiteLogo size="md" />
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 pb-4">
          {COPY.nav.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = NAV_ITEM_ICONS[item.href];
            return (
              <SheetClose key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-card px-3 py-3 text-base transition hover:bg-surface-2',
                    active && 'bg-brand-soft text-brand',
                  )}
                >
                  {Icon && (
                    <Icon className={cn('size-5', active ? 'text-brand' : 'text-ink-muted')} />
                  )}
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line p-4">
          {isLoggedIn ? (
            <div className="flex flex-col gap-1">
              <SheetClose asChild>
                <Link
                  href="/mypage"
                  className="flex items-center gap-3 rounded-card px-3 py-3 text-base hover:bg-surface-2"
                >
                  <UserIcon className="size-5 text-ink-muted" />
                  {COPY.nav.mypage}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/mypage/bookmarks"
                  className="flex items-center gap-3 rounded-card px-3 py-3 text-base hover:bg-surface-2"
                >
                  <BookmarkIcon className="size-5 text-ink-muted" />
                  {COPY.nav.bookmarks}
                </Link>
              </SheetClose>
              {isAdmin && (
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-card px-3 py-3 text-base hover:bg-surface-2"
                  >
                    <ShieldIcon className="size-5 text-ink-muted" />
                    {COPY.nav.admin}
                  </Link>
                </SheetClose>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-card px-3 py-3 text-base text-destructive hover:bg-destructive/10"
                >
                  <LogoutIcon className="size-5" />
                  {COPY.nav.logout}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <SheetClose asChild>
                <Link
                  href="/auth/login"
                  className="rounded-card border border-line bg-white px-4 py-3 text-center text-sm font-medium hover:border-line-strong"
                >
                  {COPY.nav.login}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/auth/signup"
                  className="rounded-card bg-brand px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  {COPY.nav.signup}
                </Link>
              </SheetClose>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
