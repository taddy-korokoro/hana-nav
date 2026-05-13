import type { Metadata } from 'next';
import Link from 'next/link';
import { ReviewStatusBadge } from '@/app/admin/_components/admin-badges';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions';
import { COPY } from '@/lib/constants/copy';
import { listAdminReviews } from '@/lib/queries/admin-reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.reviews.list.metaTitle,
  robots: { index: false, follow: false },
};

type SearchParams = {
  status?: string;
  q?: string;
  ng?: string;
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const ngOnly = sp.ng === '1';
  const q = sp.q?.trim() || undefined;

  const reviews = await listAdminReviews({ status, ngOnly, q });

  const c = COPY.admin.reviews.list;
  const filters = c.filters;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <form
        method="get"
        className="mt-6 flex flex-col gap-3 rounded-card border border-line bg-white p-4 md:mt-8 md:grid md:grid-cols-[180px_auto_1fr_auto] md:items-end"
      >
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{filters.status}</span>
          <select
            name="status"
            defaultValue={status ?? 'all'}
            className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="all">{filters.statusAll}</option>
            <option value="active">{filters.statusActive}</option>
            <option value="deleted">{filters.statusDeleted}</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ng"
            value="1"
            defaultChecked={ngOnly}
            className="size-4 rounded border-line"
          />
          <span className="text-xs font-medium text-ink-muted">{filters.ngOnly}</span>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{filters.q}</span>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder={filters.qPlaceholder}
            className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 md:flex-none"
          >
            {filters.apply}
          </button>
          <Link
            href="/admin/reviews"
            className="flex-1 rounded-pill border border-line bg-white px-4 py-2 text-center text-sm text-ink-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink md:flex-none"
          >
            {filters.reset}
          </Link>
        </div>
      </form>

      {reviews.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-white p-10 text-center text-sm text-ink-muted">
          {c.empty}
        </p>
      ) : (
        <>
          {/* モバイル: カード積みリスト */}
          <ul className="mt-6 grid grid-cols-1 gap-3 md:hidden">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-card border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/spots/${r.spotId}`}
                      className="block truncate font-medium text-ink hover:text-brand"
                    >
                      {r.spotName}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {r.userId ? (
                        <Link href={`/admin/users/${r.userId}`} className="hover:text-brand">
                          {r.authorWithdrawn ? c.anonymousName : (r.username ?? c.anonymousName)}
                        </Link>
                      ) : (
                        c.anonymousName
                      )}
                      <span className="mx-1.5 text-ink-faint">・</span>
                      <span className="text-brand">{c.ratingSuffix(r.rating)}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-ink-faint">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                {r.comment && <p className="mt-2 break-words text-sm text-ink">{r.comment}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ReviewStatusBadge isDeleted={r.isDeleted} />
                  {r.containsNg && (
                    <span className="inline-flex items-center rounded-pill bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      {c.ngBadge}
                    </span>
                  )}
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Link
                      href={`/spots/${r.spotId}`}
                      className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                    >
                      {c.viewSpot}
                    </Link>
                    <ReviewModerationActions reviewId={r.id} isDeleted={r.isDeleted} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* デスクトップ: テーブル */}
          <div className="mt-6 hidden overflow-x-auto rounded-card border border-line bg-white md:block">
            <table className="w-full min-w-[860px] table-auto text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">{c.table.spot}</th>
                  <th className="px-4 py-3">{c.table.user}</th>
                  <th className="px-4 py-3">{c.table.rating}</th>
                  <th className="px-4 py-3">{c.table.comment}</th>
                  <th className="px-4 py-3">{c.table.createdAt}</th>
                  <th className="px-4 py-3">{c.table.status}</th>
                  <th className="px-4 py-3 text-right">{c.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/spots/${r.spotId}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {r.spotName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {r.userId ? (
                        <Link href={`/admin/users/${r.userId}`} className="hover:text-brand">
                          {r.authorWithdrawn ? c.anonymousName : (r.username ?? c.anonymousName)}
                        </Link>
                      ) : (
                        c.anonymousName
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand">{c.ratingSuffix(r.rating)}</td>
                    <td className="px-4 py-3 max-w-md text-sm text-ink">
                      <div className="space-y-1">
                        {r.comment ? (
                          <p className="break-words">{r.comment}</p>
                        ) : (
                          <p className="text-ink-faint">—</p>
                        )}
                        {r.containsNg && (
                          <span className="inline-flex items-center rounded-pill bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            {c.ngBadge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-faint">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <ReviewStatusBadge isDeleted={r.isDeleted} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/spots/${r.spotId}`}
                          className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                        >
                          {c.viewSpot}
                        </Link>
                        <ReviewModerationActions reviewId={r.id} isDeleted={r.isDeleted} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function parseStatus(raw: string | undefined): 'all' | 'active' | 'deleted' | undefined {
  if (raw === 'active' || raw === 'deleted' || raw === 'all') return raw;
  return undefined;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
