'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { logout } from '@/app/auth/logout/actions';
import { LogoutIcon, MenuIcon } from '@/components/layout/icons';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { COPY } from '@/lib/constants/copy';
import { AdminNav } from './admin-nav';

type Props = {
  children: React.ReactNode;
};

/**
 * 管理画面のシェル。
 *
 * - `lg+`：左に固定幅 256px のサイドバー、右にコンテンツの 2 カラム
 * - `<lg`：上部にトップバー（ロゴ + 右端ハンバーガー）。タップで右から Sheet
 *          ドロワーが開き、ナビ・サイトに戻る・ログアウトを一括収納する
 *
 * 一般画面の `MobileNav` とハンバーガー位置・ドロワー方向・ログアウトボタン
 * のスタイル（destructive）を揃えている。
 *
 * 認証・認可（`requireAdmin`）は親レイアウト側で完結させる。
 */
export function AdminShell({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink lg:flex-row">
      {/* モバイル：上部のトップバー（ロゴ + 右端ハンバーガー） */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-serif text-base font-bold tracking-wider">{COPY.site.name}</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-brand">
            {COPY.admin.nav.eyebrow}
          </span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="grid size-10 place-items-center rounded-pill border border-line bg-white"
            aria-label={COPY.admin.nav.openMenu}
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80 max-w-[85vw] bg-white p-0">
            <SheetTitle className="sr-only">{COPY.admin.nav.eyebrow}</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="border-b border-line px-5 py-4">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-3"
                >
                  <span className="font-serif text-lg font-bold tracking-wider">
                    {COPY.site.name}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
                    {COPY.admin.nav.eyebrow}
                  </span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <AdminNav onNavigate={() => setOpen(false)} />
              </div>
              <div className="border-t border-line p-3">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-card px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <span>{COPY.admin.nav.backToSite}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} />
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="mt-1 flex w-full items-center gap-3 rounded-card px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                  >
                    <LogoutIcon className="size-4" />
                    {COPY.nav.logout}
                  </button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* デスクトップ：サイドバー */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-white lg:flex lg:flex-col">
        <div className="border-b border-line px-5 py-5">
          <Link href="/admin" className="flex items-baseline gap-3">
            <span className="font-serif text-lg font-bold tracking-wider">{COPY.site.name}</span>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
              {COPY.admin.nav.eyebrow}
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminNav />
        </div>
        <div className="border-t border-line p-3">
          <Link
            href="/"
            className="flex items-center justify-between gap-2 rounded-card px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <span>{COPY.admin.nav.backToSite}</span>
            <ArrowUpRight className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-3 rounded-card px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
            >
              <LogoutIcon className="size-4" />
              {COPY.nav.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
