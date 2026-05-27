import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRightIcon } from '@/components/layout/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';
import { getMyMypageStats, getMyProfile } from '@/lib/queries/mypage';
import { requireUser } from '@/lib/utils/requireUser';
import { WithdrawSection } from './_components/withdraw-section';


export const metadata: Metadata = {
  title: COPY.mypage.top.metaTitle,
};

export default async function MypageTopPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { error: errorKey }] = await Promise.all([requireUser(), searchParams]);
  const [profile, stats] = await Promise.all([getMyProfile(user.id), getMyMypageStats(user.id)]);

  if (!profile) {
    notFound();
  }

  const errorMessage = errorKey ? COPY.mypage.top.withdraw.errors[errorKey] : null;

  const displayName = profile.username ?? COPY.mypage.top.anonymousName;
  const initial = (profile.username ?? user.email ?? 'U').slice(0, 1).toUpperCase();
  const isAdmin = profile.role === 'admin';

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header className="pb-2">
        <Breadcrumb
          className="mb-4"
          items={[{ label: COPY.nav.labels.home, href: '/' }, { label: COPY.mypage.top.title }]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.mypage.top.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {COPY.mypage.top.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
          {COPY.mypage.top.description}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-6 rounded-card-lg bg-white p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <Avatar size="lg" className="size-16 sm:size-20">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
          <AvatarFallback className="font-serif text-2xl">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-2xl font-bold tracking-tight">{displayName}</p>
          <p className="mt-1 truncate text-sm text-ink-muted">{user.email}</p>
          {isAdmin && (
            <span className="mt-3 inline-flex rounded-pill bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              {COPY.mypage.top.roleLabels[profile.role] ?? profile.role}
            </span>
          )}
        </div>
        <Link
          href="/mypage/profile"
          className="inline-flex shrink-0 items-center justify-center rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-line-strong"
        >
          {COPY.mypage.profile.title}
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        <MenuCard
          href="/mypage/bookmarks"
          title={COPY.mypage.top.menu.bookmarksTitle}
          description={COPY.mypage.top.menu.bookmarksDescription}
          count={stats.bookmarkCount}
        />
        <MenuCard
          href="/mypage/reviews"
          title={COPY.mypage.top.menu.reviewsTitle}
          description={COPY.mypage.top.menu.reviewsDescription}
          count={stats.reviewCount}
        />
        {isAdmin && (
          <MenuCard
            href="/admin"
            title={COPY.mypage.top.menu.adminTitle}
            description={COPY.mypage.top.menu.adminDescription}
          />
        )}
      </div>

      <div className="mt-16 rounded-card-lg border border-danger/40 bg-danger-soft/40 p-6 sm:p-8">
        <WithdrawSection errorMessage={errorMessage} />
      </div>
    </section>
  );
}

function MenuCard({
  href,
  title,
  description,
  count,
}: {
  href: string;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 rounded-card border border-line bg-white p-6 transition hover:border-line-strong"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <p className="font-serif text-lg font-semibold">{title}</p>
          {typeof count === 'number' && (
            <p className="text-sm text-ink-muted">
              <span className="font-serif text-xl font-bold text-ink">{count}</span>
              <span className="ml-1">{COPY.mypage.top.summary.countSuffix}</span>
            </p>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <ArrowRightIcon className="size-5 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
    </Link>
  );
}
