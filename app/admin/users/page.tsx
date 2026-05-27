import type { Metadata } from 'next';
import Link from 'next/link';
import { RoleBadge, WithdrawnBadge } from '@/app/admin/_components/admin-badges';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { UserFilters } from '@/components/admin/UserFilters';
import { COPY } from '@/lib/constants/copy';
import { listAdminUsers } from '@/lib/queries/admin-users';


export const metadata: Metadata = {
  title: COPY.admin.users.list.metaTitle,
  robots: { index: false, follow: false },
};

type SearchParams = {
  status?: string;
  role?: string;
  q?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const role = parseRole(sp.role);
  const q = sp.q?.trim() || undefined;

  const users = await listAdminUsers({ status, role, q });

  const c = COPY.admin.users.list;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <UserFilters initialStatus={status ?? 'all'} initialRole={role ?? 'all'} initialQ={q ?? ''} />

      {users.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-white p-10 text-center text-sm text-ink-muted">
          {c.empty}
        </p>
      ) : (
        <>
          {/* モバイル: カード積みリスト */}
          <ul className="mt-6 grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => (
              <li key={u.id} className="rounded-card border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="block truncate font-medium text-ink hover:text-brand"
                    >
                      {u.username ?? c.anonymousName}
                    </Link>
                    {u.email && <p className="mt-0.5 truncate text-xs text-ink-muted">{u.email}</p>}
                  </div>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="shrink-0 rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                  >
                    {c.actions.view}
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <RoleBadge role={u.role} />
                  <WithdrawnBadge isWithdrawn={u.isWithdrawn} />
                  <span className="ml-auto text-ink-faint">{formatDate(u.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* デスクトップ: テーブル */}
          <div className="mt-6 hidden overflow-hidden rounded-card border border-line bg-white md:block">
            <table className="w-full table-auto text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">{c.table.username}</th>
                  <th className="px-4 py-3">{c.table.email}</th>
                  <th className="px-4 py-3">{c.table.role}</th>
                  <th className="px-4 py-3">{c.table.status}</th>
                  <th className="px-4 py-3">{c.table.createdAt}</th>
                  <th className="px-4 py-3 text-right">{c.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {u.username ?? c.anonymousName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-ink-muted">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 align-top">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <WithdrawnBadge isWithdrawn={u.isWithdrawn} />
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-ink-faint">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                        >
                          {c.actions.view}
                        </Link>
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

function parseStatus(raw: string | undefined): 'all' | 'active' | 'withdrawn' | undefined {
  if (raw === 'active' || raw === 'withdrawn' || raw === 'all') return raw;
  return undefined;
}

function parseRole(raw: string | undefined): 'all' | 'user' | 'admin' | undefined {
  if (raw === 'user' || raw === 'admin' || raw === 'all') return raw;
  return undefined;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
