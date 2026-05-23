'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COPY } from '@/lib/constants/copy';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

type SessionData = {
  email: string;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
} | null;

/**
 * SiteHeader の認証依存部分（UserMenu / ログインボタン / MobileNav）を
 * 1 つの Client Component に集約する。
 *
 * SiteHeader 自体を Server Component（cookies 非依存）に保つことで、
 * トップ等の公開ページが ISR の対象になる。認証状態は /api/me/profile
 * を fetch して Client 側で解決する。
 */
export function UserNavIsland() {
  const [session, setSession] = useState<SessionData | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    fetch('/api/me/profile', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SessionData) => {
        if (mounted) setSession(data);
      })
      .catch(() => {
        if (mounted) setSession(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loaded = session !== undefined;
  const user = session ?? null;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <>
      {/* デスクトップ用：UserMenu または ログイン/会員登録 */}
      {!loaded ? (
        <div
          className="hidden h-10 w-32 animate-pulse rounded-pill bg-surface-2 md:block"
          aria-hidden
        />
      ) : user ? (
        <div className="hidden md:block">
          <UserMenu
            email={user.email}
            username={user.username}
            avatarUrl={user.avatarUrl}
            isAdmin={user.isAdmin}
          />
        </div>
      ) : (
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/auth/login"
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong"
          >
            {COPY.nav.login}
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            {COPY.nav.signup}
          </Link>
        </div>
      )}

      {/* モバイル用：MobileNav は loaded を待たず常に表示。
          認証メニューは fetch 後の値で切り替わる（フラッシュは sheet を開いた時点でほぼ解決済み）。 */}
      <MobileNav isLoggedIn={!!user} isAdmin={isAdmin} />
    </>
  );
}
