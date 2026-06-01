import { Search, X } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { DeleteFlowerDialog } from '@/app/admin/flowers/_components/delete-flower-dialog';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { listAdminFlowers } from '@/lib/queries/admin';

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
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        rightSlot={
          <Link
            href="/admin/flowers/new"
            className="rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            {c.newCta}
          </Link>
        }
      />

      {/* 検索フォームは公開側 /flowers のスタイルに揃えた一体型検索バー。
          検索範囲は管理画面特有の alias 検索を維持する（listAdminFlowers）。 */}
      <form
        method="get"
        role="search"
        className="mt-8 flex items-center gap-2 rounded-card-lg border border-line bg-white p-2 shadow-sm transition-colors focus-within:border-line-strong"
      >
        <Search className="ml-3 size-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder={filters.qPlaceholder}
          aria-label={filters.q}
          className="w-full bg-transparent py-3 text-base outline-none placeholder:text-ink-faint"
        />
        <Button type="submit" size="md" className="shrink-0">
          <Search className="size-4" aria-hidden />
          {filters.apply}
        </Button>
      </form>

      {q && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-muted">
            「{q}」の検索結果 {flowers.length} 件
          </span>
          <Link
            href="/admin/flowers"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
            {filters.reset}
          </Link>
        </div>
      )}

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
