import type { Metadata } from 'next';
import Link from 'next/link';
import { UserFilters } from '@/components/admin/UserFilters';
import { COPY } from '@/lib/constants/copy';
import { listAdminUsers } from '@/lib/queries/admin-users';

export const dynamic = 'force-dynamic';

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
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{c.description}</p>
      </header>

      <UserFilters initialStatus={status ?? 'all'} initialRole={role ?? 'all'} initialQ={q ?? ''} />

      <div className="mt-8 overflow-x-auto rounded-card border border-line bg-white">
        <table className="w-full min-w-[800px] table-auto text-left text-sm">
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
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-muted">
                  {c.empty}
                </td>
              </tr>
            )}
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
                  <RoleBadge role={u.role} labels={c.roleLabels} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge
                    isWithdrawn={u.isWithdrawn}
                    activeLabel={c.statusBadge.active}
                    withdrawnLabel={c.statusBadge.withdrawn}
                  />
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
    </section>
  );
}

function RoleBadge({ role, labels }: { role: 'user' | 'admin'; labels: Record<string, string> }) {
  const cls =
    role === 'admin'
      ? 'inline-flex items-center rounded-pill bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand'
      : 'inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-muted';
  return <span className={cls}>{labels[role]}</span>;
}

function StatusBadge({
  isWithdrawn,
  activeLabel,
  withdrawnLabel,
}: {
  isWithdrawn: boolean;
  activeLabel: string;
  withdrawnLabel: string;
}) {
  if (isWithdrawn) {
    return (
      <span className="inline-flex items-center rounded-pill bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        {withdrawnLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {activeLabel}
    </span>
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
