import Link from 'next/link';
import { logout } from '@/app/auth/logout/actions';
import { COPY } from '@/lib/constants/copy';
import { requireAdmin } from '@/lib/utils/requireAdmin';
import { AdminNav } from './_components/admin-nav';

/**
 * 管理画面共通レイアウト。middleware の二重防御として `requireAdmin()` を呼び、
 * 非 admin が直接アクセスした場合も `/` にリダイレクトさせる。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/admin" className="flex items-baseline gap-3">
            <span className="font-serif text-lg font-bold tracking-wider">{COPY.site.name}</span>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
              {COPY.admin.nav.eyebrow}
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="rounded-pill border border-line bg-white px-3 py-1.5 transition hover:border-line-strong hover:bg-surface-2"
            >
              {COPY.admin.nav.backToSite}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-pill border border-line bg-white px-3 py-1.5 transition hover:border-line-strong hover:bg-surface-2"
              >
                {COPY.nav.logout}
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
