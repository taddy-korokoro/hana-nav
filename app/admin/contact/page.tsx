import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { COPY } from '@/lib/constants/copy';
import { CONTACT_STATUSES, type ContactStatus, listContactMessages } from '@/lib/queries/contact';
import { requireAdmin } from '@/lib/utils/requireAdmin';

export const metadata: Metadata = {
  title: COPY.admin.contact.list.metaTitle,
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string }>;

export default async function AdminContactPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const messages = await listContactMessages({ status });

  const c = COPY.admin.contact.list;
  const categoryLabels = COPY.admin.contact.categoryLabels;
  const statusLabels = COPY.admin.contact.statusLabels;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <form
        method="get"
        className="mt-6 flex flex-col gap-3 rounded-card border border-line bg-white p-4 md:flex-row md:items-end"
      >
        <label className="text-sm md:w-60">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{c.filterStatus}</span>
          <select
            name="status"
            defaultValue={status ?? 'all'}
            className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="all">{c.filterStatusAll}</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="w-full rounded-card border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2 md:w-auto"
        >
          適用
        </button>
      </form>

      {messages.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-ink-muted">
          {c.empty}
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">{c.columns.received}</th>
                <th className="whitespace-nowrap px-4 py-3">{c.columns.name}</th>
                <th className="whitespace-nowrap px-4 py-3">{c.columns.category}</th>
                <th className="whitespace-nowrap px-4 py-3">{c.columns.status}</th>
                <th className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                  {c.columns.preview}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {messages.map((m) => (
                <tr key={m.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/contact/${m.id}`}
                      className="text-brand hover:text-brand-hover"
                    >
                      {formatDate(m.createdAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-ink">{m.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    {categoryLabels[m.category]}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="hidden px-4 py-3 align-top text-ink-muted md:table-cell">
                    <p className="line-clamp-2 whitespace-pre-line">{m.messagePreview}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function parseStatus(raw: string | undefined): ContactStatus | undefined {
  if (!raw || raw === 'all') return undefined;
  if ((CONTACT_STATUSES as readonly string[]).includes(raw)) return raw as ContactStatus;
  return undefined;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: ContactStatus }) {
  const label = COPY.admin.contact.statusLabels[status];
  const className =
    status === 'NEW'
      ? 'bg-brand-soft text-brand'
      : status === 'IN_PROGRESS'
        ? 'bg-warning/10 text-warning'
        : 'bg-success/10 text-success';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
