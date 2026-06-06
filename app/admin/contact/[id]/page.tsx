import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { softDeleteContactAction, updateContactStatusAction } from '@/app/admin/contact/actions';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { COPY } from '@/lib/constants/copy';
import { CONTACT_STATUSES, getContactMessageDetail } from '@/lib/queries/contact';
import { requireAdmin } from '@/lib/utils/requireAdmin';

export const metadata: Metadata = {
  title: COPY.admin.contact.detail.metaTitle,
  robots: { index: false, follow: false },
};

type Params = Promise<{ id: string }>;

export default async function AdminContactDetailPage({ params }: { params: Params }) {
  await requireAdmin();

  const { id } = await params;
  const detail = await getContactMessageDetail(id);
  if (!detail) notFound();

  const c = COPY.admin.contact.detail;
  const categoryLabels = COPY.admin.contact.categoryLabels;
  const statusLabels = COPY.admin.contact.statusLabels;

  return (
    <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader
        eyebrow={c.eyebrow}
        title={`${categoryLabels[detail.category]} - ${detail.name}`}
        backLink={{ href: '/admin/contact', label: c.backToList }}
      />

      <div className="mt-8 grid gap-4 rounded-card border border-line bg-white p-5 md:grid-cols-2">
        <Meta label={c.meta.received}>{formatDateTime(detail.createdAt)}</Meta>
        <Meta label={c.meta.updated}>{formatDateTime(detail.updatedAt)}</Meta>
        <Meta label={c.meta.email}>
          <a href={`mailto:${detail.email}`} className="text-brand hover:text-brand-hover">
            {detail.email}
          </a>
        </Meta>
        <Meta label={c.meta.userId}>
          {detail.userId ?? <span className="text-ink-muted">{c.meta.anonymous}</span>}
        </Meta>
        {detail.referenceUrl && (
          <Meta label={c.meta.referenceUrl} className="md:col-span-2">
            <a
              href={detail.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-brand hover:text-brand-hover"
            >
              {detail.referenceUrl}
            </a>
          </Meta>
        )}
      </div>

      <article className="mt-8 rounded-card border border-line bg-white p-5">
        <p className="whitespace-pre-line text-sm leading-7 text-ink">{detail.message}</p>
      </article>

      <section className="mt-8 rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">{c.statusSection}</h2>
        <form action={updateContactStatusAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={detail.id} />
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              {COPY.admin.contact.list.columns.status}
            </span>
            <select
              name="status"
              defaultValue={detail.status}
              className="rounded-card border border-line bg-white px-3 py-2 text-sm"
            >
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-card bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            {c.statusUpdate}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-card border border-danger/30 bg-white p-5">
        <h2 className="text-sm font-medium text-danger">{c.deleteSection}</h2>
        <form action={softDeleteContactAction} className="mt-3">
          <input type="hidden" name="id" value={detail.id} />
          <button
            type="submit"
            className="rounded-card border border-danger/40 bg-white px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5"
          >
            {c.delete}
          </button>
        </form>
      </section>
    </section>
  );
}

function Meta({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-sm text-ink">{children}</p>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(d);
}
