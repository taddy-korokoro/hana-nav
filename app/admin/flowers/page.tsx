import type { Metadata } from 'next';
import Link from 'next/link';
import { DeleteFlowerDialog } from '@/app/admin/flowers/_components/delete-flower-dialog';
import { COPY } from '@/lib/constants/copy';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { listAdminFlowers } from '@/lib/queries/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.flowers.list.metaTitle,
  robots: { index: false, follow: false },
};

type SearchParams = {
  q?: string;
};

export default async function AdminFlowersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;

  const flowers = await listAdminFlowers({ q });

  const c = COPY.admin.flowers.list;
  const filters = c.filters;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{c.description}</p>
        </div>
        <Link
          href="/admin/flowers/new"
          className="rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          {c.newCta}
        </Link>
      </header>

      <form
        method="get"
        className="mt-8 grid grid-cols-1 gap-3 rounded-card border border-line bg-white p-4 md:grid-cols-[2fr_auto_auto]"
      >
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
            href="/admin/flowers"
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
              <th className="px-4 py-3">{c.table.nameKana}</th>
              <th className="px-4 py-3">{c.table.aliases}</th>
              <th className="px-4 py-3">{c.table.season}</th>
              <th className="px-4 py-3">{c.table.spotCount}</th>
              <th className="px-4 py-3">{c.table.updatedAt}</th>
              <th className="px-4 py-3 text-right">{c.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {flowers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-muted">
                  {c.empty}
                </td>
              </tr>
            )}
            {flowers.map((f) => {
              const visible = f.aliases.slice(0, 3);
              const more = f.aliases.length - visible.length;
              return (
                <tr key={f.id} className="border-t border-line">
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/flowers/${f.id}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">{f.nameKana ?? ''}</td>
                  <td className="px-4 py-3 align-top">
                    {visible.length === 0 ? (
                      <span className="text-xs text-ink-faint">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {visible.map((a) => (
                          <span
                            key={a}
                            className="rounded-pill border border-line bg-surface-2 px-2 py-0.5 text-xs text-ink-muted"
                          >
                            {a}
                          </span>
                        ))}
                        {more > 0 && (
                          <span className="rounded-pill border border-line bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">
                            {c.aliasMore(more)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    {f.defaultSeasonStart != null && f.defaultSeasonEnd != null
                      ? formatSeasonRange(f.defaultSeasonStart, f.defaultSeasonEnd)
                      : c.seasonUnset}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    {f.spotCount}
                    {c.spotCountSuffix}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-ink-faint">
                    {formatDate(f.updatedAt)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/flowers/${f.id}`}
                        className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                      >
                        {c.actions.edit}
                      </Link>
                      <DeleteFlowerDialog
                        flowerId={f.id}
                        flowerName={f.name}
                        triggerLabel={c.actions.delete}
                        title={c.actions.deleteDialogTitle}
                        description={c.actions.deleteDialogDescription}
                        confirmLabel={c.actions.deleteDialogConfirm}
                        cancelLabel={c.actions.deleteDialogCancel}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 16).replace('T', ' ');
}
