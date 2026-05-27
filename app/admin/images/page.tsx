import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { COPY } from '@/lib/constants/copy';
import { listAllImages } from '@/lib/queries/admin';
import { softDeleteImageAction } from './actions';


export const metadata: Metadata = {
  title: COPY.admin.images.list.metaTitle,
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 60;

type SearchParams = {
  owner?: string;
  page?: string;
};

export default async function AdminImagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const ownerFilter = parseOwner(sp.owner);
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total } = await listAllImages({
    ownerType: ownerFilter,
    limit: PAGE_SIZE,
    offset,
  });

  const c = COPY.admin.images.list;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(total, offset + rows.length);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <form
        method="get"
        className="mt-8 grid grid-cols-1 gap-3 rounded-card border border-line bg-white p-4 md:grid-cols-[1fr_auto_auto]"
      >
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            {c.filters.ownerType}
          </span>
          <select
            name="owner"
            defaultValue={ownerFilter ?? 'all'}
            className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="all">{c.filters.ownerTypeAll}</option>
            <option value="spot">{c.filters.ownerTypeSpot}</option>
            <option value="flower">{c.filters.ownerTypeFlower}</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85"
          >
            {c.filters.apply}
          </button>
          <Link
            href="/admin/images"
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm text-ink-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
          >
            {c.filters.reset}
          </Link>
        </div>
      </form>

      <p className="mt-6 text-xs text-ink-muted">{c.pagination.summary(start, end, total)}</p>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-muted">{c.empty}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((img) => {
            const editHref =
              img.ownerType === 'spot'
                ? `/admin/spots/${img.ownerId}`
                : `/admin/flowers/${img.ownerId}`;
            return (
              <li key={img.id} className="overflow-hidden rounded-card border border-line bg-white">
                <div className="aspect-square w-full overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-pill border border-line bg-surface-2 px-2 py-0.5 text-ink-muted">
                      {c.ownerLabel[img.ownerType]}
                    </span>
                    <span className="text-ink-faint">{c.orderLabel(img.displayOrder)}</span>
                  </div>
                  {img.ownerName ? (
                    <Link href={editHref} className="block text-sm font-medium hover:text-brand">
                      {img.ownerName}
                    </Link>
                  ) : (
                    <p className="text-sm text-ink-faint">{c.orphanLabel}</p>
                  )}
                  {img.caption && (
                    <p className="line-clamp-2 text-xs text-ink-muted">{img.caption}</p>
                  )}
                  <form action={softDeleteImageAction}>
                    <input type="hidden" name="image_id" value={img.id} />
                    <button
                      type="submit"
                      className="w-full rounded-pill border border-destructive/30 bg-white px-3 py-1 text-xs text-destructive transition hover:border-destructive/50 hover:bg-destructive/10"
                    >
                      {c.delete}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={buildPageHref(ownerFilter, page - 1)}
              className="rounded-pill border border-line bg-white px-4 py-1.5 transition hover:border-line-strong hover:bg-surface-2"
            >
              {c.pagination.previous}
            </Link>
          ) : (
            <span className="rounded-pill border border-line bg-white px-4 py-1.5 text-ink-faint">
              {c.pagination.previous}
            </span>
          )}
          <span className="text-ink-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildPageHref(ownerFilter, page + 1)}
              className="rounded-pill border border-line bg-white px-4 py-1.5 transition hover:border-line-strong hover:bg-surface-2"
            >
              {c.pagination.next}
            </Link>
          ) : (
            <span className="rounded-pill border border-line bg-white px-4 py-1.5 text-ink-faint">
              {c.pagination.next}
            </span>
          )}
        </nav>
      )}
    </section>
  );
}

function parseOwner(raw: string | undefined): 'spot' | 'flower' | undefined {
  if (raw === 'spot' || raw === 'flower') return raw;
  return undefined;
}

function buildPageHref(owner: 'spot' | 'flower' | undefined, page: number): string {
  const params = new URLSearchParams();
  if (owner) params.set('owner', owner);
  if (page > 1) params.set('page', String(page));
  const q = params.toString();
  return q ? `/admin/images?${q}` : '/admin/images';
}
