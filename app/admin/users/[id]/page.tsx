import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoleBadge, WithdrawnBadge } from '@/app/admin/_components/admin-badges';
import { AdminCard } from '@/app/admin/_components/admin-card';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { UserBanButton } from '@/components/admin/UserBanButton';
import { UserRoleSelector } from '@/components/admin/UserRoleSelector';
import { COPY } from '@/lib/constants/copy';
import { getAdminUserDetail } from '@/lib/queries/admin-users';
import { getCurrentUser } from '@/lib/supabase/get-user';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.users.detail.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) {
    notFound();
  }

  // layout の requireAdmin() と同じユーザーを参照する。`React.cache` によって
  // 同一リクエスト内では Auth サーバー往復が 1 回に集約される。
  const me = await getCurrentUser();
  const isSelf = me?.id === detail.id;

  const c = COPY.admin.users.detail;

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-8 md:space-y-10 md:px-6 md:pt-12">
      <AdminPageHeader
        eyebrow={c.eyebrow}
        title={detail.username ?? c.anonymousName}
        backLink={{ href: '/admin/users', label: c.backToList }}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <RoleBadge role={detail.role} />
            <WithdrawnBadge isWithdrawn={detail.isWithdrawn} />
          </div>
        }
      />

      <AdminCard title={c.sections.profile}>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
          <Item label={c.profileLabels.id} value={<code className="text-xs">{detail.id}</code>} />
          <Item label={c.profileLabels.username} value={detail.username ?? '—'} />
          <Item label={c.profileLabels.email} value={detail.email ?? '—'} />
          <Item label={c.profileLabels.role} value={c.roleLabels[detail.role] ?? detail.role} />
          <Item
            label={c.profileLabels.status}
            value={detail.isWithdrawn ? c.statusBadge.withdrawn : c.statusBadge.active}
          />
          <Item
            label={c.profileLabels.createdAt}
            value={formatDateTime(detail.authCreatedAt ?? detail.createdAt)}
          />
          <Item label={c.profileLabels.updatedAt} value={formatDateTime(detail.updatedAt)} />
          {detail.deletedAt && (
            <Item label={c.profileLabels.deletedAt} value={formatDateTime(detail.deletedAt)} />
          )}
        </dl>
      </AdminCard>

      <AdminCard title={c.sections.dangerZone}>
        <p className="mt-2 text-xs text-ink-muted">
          {isSelf ? c.cannotDemoteSelf : c.banAction.confirmBan}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <UserRoleSelector
            userId={detail.id}
            currentRole={detail.role}
            disabled={isSelf && detail.role === 'admin'}
            isWithdrawn={detail.isWithdrawn}
          />
          <UserBanButton
            userId={detail.id}
            isWithdrawn={detail.isWithdrawn}
            disabled={isSelf && !detail.isWithdrawn}
          />
        </div>
      </AdminCard>

      <AdminCard title={c.sections.reviews}>
        {detail.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{c.reviewsEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {detail.reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={`/spots/${r.spotId}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {r.spotName}
                    </Link>
                    <span className="text-brand">{c.ratingSuffix(r.rating)}</span>
                    {r.isDeleted && (
                      <span className="rounded-pill bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        {c.reviewSoftDeletedBadge}
                      </span>
                    )}
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm text-ink-muted break-words">{r.comment}</p>
                  )}
                  <p className="mt-1 text-[11px] text-ink-faint">{formatDateTime(r.createdAt)}</p>
                </div>
                <Link
                  href={`/spots/${r.spotId}`}
                  className="rounded-pill border border-line bg-white px-3 py-1 text-xs text-ink-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
                >
                  {c.viewSpot}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={c.sections.bookmarks}>
        {detail.bookmarks.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{c.bookmarksEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {detail.bookmarks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3 text-xs">
                  <Link
                    href={`/spots/${b.spotId}`}
                    className="font-medium text-ink hover:text-brand"
                  >
                    {b.spotName ?? '—'}
                  </Link>
                  {b.isDeleted && (
                    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                      {c.bookmarkSoftDeletedBadge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-ink-faint">{formatDateTime(b.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard
        title={c.sections.aiUsage}
        titleExtra={<p className="text-xs text-ink-muted">{c.aiUsageTotal(detail.aiUsageTotal)}</p>}
      >
        {detail.aiUsage.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{c.aiUsageEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {detail.aiUsage.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
              >
                <span className="text-ink-muted">{formatDateTime(a.usedAt)}</span>
                <span className="flex items-center gap-2">
                  {a.rewardUnlocked && (
                    <span className="rounded-pill bg-brand/10 px-2 py-0.5 font-medium text-brand">
                      story
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </section>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // JST 表示。9 時間進めて UTC として ISO 文字列にし、上位 16 文字 "YYYY-MM-DD HH:mm" を取り出す。
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 16).replace('T', ' ');
}
