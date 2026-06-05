import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { DeleteSpotDialog } from '@/app/admin/_components/delete-spot-dialog';
import { PublishToggle } from '@/app/admin/_components/publish-toggle';
import { COPY } from '@/lib/constants/copy';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { listAdminSpots, listPrefectures } from '@/lib/queries/admin';


export const metadata: Metadata = {
  title: COPY.admin.spots.list.metaTitle,
  robots: { index: false, follow: false },
};

type SearchParams = {
  status?: string;
  prefecture?: string;
  q?: string;
};

export default async function AdminSpotsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const statusKey = parseStatus(sp.status);
  const prefectureId = sp.prefecture ? Number(sp.prefecture) : undefined;
  const q = sp.q?.trim() || undefined;

  const [spots, prefectures] = await Promise.all([
    listAdminSpots({
      status: statusKey,
      prefectureId:
        Number.isInteger(prefectureId) && prefectureId! >= 1 && prefectureId! <= 47
          ? prefectureId
          : undefined,
      q,
    }),
    listPrefectures(),
  ]);

  const c = COPY.admin.spots.list;
  const filters = c.filters;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        rightSlot={
          <Link
            href="/admin/spots/new"
            className="rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            {c.newCta}
          </Link>
        }
      />

      <form
        method="get"
        className="mt-8 grid grid-cols-1 gap-3 rounded-card border border-line bg-white p-4 md:grid-cols-[1fr_1fr_2fr_auto_auto]"
      >
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">{filters.status}</span>
          <select
            name="status"
            defaultValue={statusKey ?? 'all'}
            className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="all">{filters.statusAll}</option>
            <option value="published">{filters.statusPublished}</option>
            <option value="unpublished">{filters.statusUnpublished}</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            {filters.prefecture}
          </span>
          <select
            name="prefecture"
            defaultValue={prefectureId ?? ''}
            className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">{filters.prefectureAll}</option>
            {prefectures.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
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
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85"
          >
            {filters.apply}
          </button>
          <Link
            href="/admin/spots"
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm text-ink-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
          >
            {filters.reset}
          </Link>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-card border border-line bg-white">
        <table className="w-full min-w-[720px] table-auto text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3">{c.table.name}</th>
              <th className="px-4 py-3">{c.table.prefecture}</th>
              <th className="px-4 py-3">{c.table.season}</th>
              <th className="px-4 py-3">{c.table.status}</th>
              <th className="px-4 py-3">{c.table.updatedAt}</th>
              <th className="px-4 py-3 text-right">{c.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {spots.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-muted">
                  {c.empty}
                </td>
              </tr>
            )}
            {spots.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/admin/spots/${s.id}`}
                    className="font-medium text-ink hover:text-brand"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top text-ink-muted">{s.prefectureName}</td>
                <td className="px-4 py-3 align-top text-ink-muted">
                  {formatSeasonRange(s.bestSeasonStart, s.bestSeasonEnd)}
                </td>
                <td className="px-4 py-3 align-top">
                  <PublishToggle
                    spotId={s.id}
                    isPublished={s.isPublished}
                    publishedLabel={c.statusBadge.published}
                    unpublishedLabel={c.statusBadge.unpublished}
                  />
                </td>
                <td className="px-4 py-3 align-top text-xs text-ink-faint">
                  {formatDate(s.updatedAt)}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/admin/spots/${s.id}`}
                      className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                    >
                      {c.actions.edit}
                    </Link>
                    <DeleteSpotDialog
                      spotId={s.id}
                      spotName={s.name}
                      triggerLabel={c.actions.delete}
                      title={c.actions.deleteDialogTitle}
                      description={c.actions.deleteDialogDescription}
                      confirmLabel={c.actions.deleteDialogConfirm}
                      cancelLabel={c.actions.deleteDialogCancel}
                    />
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

function parseStatus(raw: string | undefined): 'all' | 'published' | 'unpublished' | undefined {
  if (raw === 'published' || raw === 'unpublished' || raw === 'all') return raw;
  return undefined;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 16).replace('T', ' ');
}
