import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { updateContactStatusAction } from '@/app/admin/contact/actions';
import { ContactReplyForm } from '@/app/admin/contact/_components/ContactReplyForm';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { COPY } from '@/lib/constants/copy';
import {
  CONTACT_STATUSES,
  getContactMessageDetail,
  listContactReplies,
} from '@/lib/queries/contact';
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
  const replies = await listContactReplies(detail.id);

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
        <h2 className="text-sm font-medium text-ink">{c.replySection}</h2>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {c.replyHistoryTitle}
          </p>
          {replies.length === 0 ? (
            <p className="mt-2 text-xs text-ink-muted">{c.replyHistoryEmpty}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {replies.map((r) => (
                <li key={r.id} className="rounded-card border border-line bg-surface-2 p-4 text-sm">
                  <p className="font-medium text-ink">{r.subject}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {c.replySentLabel}: {formatDateTime(r.sentAt)}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {c.replyFormTitle}
          </p>
          <ContactReplyForm contactMessageId={detail.id} />
        </div>
      </section>

      <section className="mt-8 rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">{c.statusSection}</h2>
        <form
          action={updateContactStatusAction}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="id" value={detail.id} />
          <label className="block text-sm sm:flex-1 sm:max-w-xs">
            <span className="mb-1 block text-xs font-medium text-ink-muted">
              {COPY.admin.contact.list.columns.status}
            </span>
            <select
              name="status"
              defaultValue={detail.status}
              className="block w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
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
            className="w-full rounded-card bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover sm:w-auto"
          >
            {c.statusUpdate}
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
