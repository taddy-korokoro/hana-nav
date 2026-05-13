import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { COPY } from '@/lib/constants/copy';
import { listPendingSpots } from '@/lib/queries/admin';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { togglePublishedAction } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.spots.pending.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminPendingSpotsPage() {
  const spots = await listPendingSpots();
  const c = COPY.admin.spots.pending;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <div className="mt-8 space-y-4">
        {spots.length === 0 && (
          <p className="rounded-card border border-line bg-white p-6 text-center text-sm text-ink-muted">
            {c.empty}
          </p>
        )}
        {spots.map((s) => (
          <article key={s.id} className="rounded-card border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-serif text-lg font-semibold">{s.name}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {s.prefectureName} ・ {s.location}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {COPY.common.seasonPrefix}:{' '}
                  {formatSeasonRange(s.bestSeasonStart, s.bestSeasonEnd)}
                </p>
              </div>
              <Link
                href={`/admin/spots/${s.id}`}
                className="rounded-pill border border-line bg-white px-3 py-1.5 text-xs transition hover:border-line-strong hover:bg-surface-2"
              >
                {c.editLink}
              </Link>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
              <div>
                <dt className="font-medium text-ink-muted">{c.officialUrlLabel}</dt>
                <dd className="mt-0.5">
                  {s.officialUrl ? (
                    <Link
                      href={s.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-brand hover:underline"
                    >
                      {c.previewOfficial} ↗ {s.officialUrl}
                    </Link>
                  ) : (
                    <span className="text-destructive">{c.noOfficialUrl}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink-muted">{c.sourceLabel}</dt>
                <dd className="mt-0.5 break-all">
                  {s.source ? (
                    /^https?:\/\//.test(s.source) ? (
                      <Link
                        href={s.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        {c.previewSource} ↗ {s.source}
                      </Link>
                    ) : (
                      <span>{s.source}</span>
                    )
                  ) : (
                    <span className="text-destructive">{c.noSource}</span>
                  )}
                </dd>
              </div>
            </dl>

            <form action={togglePublishedAction} className="mt-4 flex justify-end">
              <input type="hidden" name="spot_id" value={s.id} />
              <input type="hidden" name="next" value="true" />
              <button
                type="submit"
                className="rounded-pill bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                {c.publish}
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
