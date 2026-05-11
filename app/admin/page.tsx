import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import { getAdminDashboardStats } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.dashboard.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const c = COPY.admin.dashboard;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{c.description}</p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={c.cards.pendingSpots}
          count={stats.pendingSpots}
          href="/admin/spots/pending"
        />
        <StatCard label={c.cards.aiUsageThisMonth} count={stats.aiUsageThisMonth} />
        <StatCard label={c.cards.recentDeletedReviews} count={stats.recentDeletedReviews} />
      </div>

      <h2 className="mt-12 font-serif text-xl font-bold tracking-tight">{c.shortcutsTitle}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ShortcutCard
          href="/admin/spots"
          title={c.shortcuts.spotsTitle}
          description={c.shortcuts.spotsDescription}
        />
        <ShortcutCard
          href="/admin/spots/pending"
          title={c.shortcuts.spotsPendingTitle}
          description={c.shortcuts.spotsPendingDescription}
        />
        <ShortcutCard
          href="/admin/spots/new"
          title={c.shortcuts.spotsNewTitle}
          description={c.shortcuts.spotsNewDescription}
        />
      </div>
    </section>
  );
}

function StatCard({ label, count, href }: { label: string; count: number; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-3 text-sm text-ink-muted">
        <span className="font-serif text-4xl font-bold text-ink">{count}</span>
        <span className="ml-1.5">{COPY.admin.dashboard.countSuffix}</span>
        {href && (
          <ArrowRightIcon className="ml-2 inline size-4 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
        )}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-card border border-line bg-white px-6 py-5 transition hover:border-line-strong"
      >
        {body}
      </Link>
    );
  }
  return <div className="rounded-card border border-line bg-white px-6 py-5">{body}</div>;
}

function ShortcutCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 rounded-card border border-line bg-white p-6 transition hover:border-line-strong"
    >
      <div>
        <p className="font-serif text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <ArrowRightIcon className="size-5 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
    </Link>
  );
}
