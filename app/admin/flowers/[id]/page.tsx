import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FlowerEditor } from '@/components/admin/FlowerEditor';
import { DeleteFlowerDialog } from '@/app/admin/flowers/_components/delete-flower-dialog';
import { COPY } from '@/lib/constants/copy';
import { getAdminFlowerDetail } from '@/lib/queries/admin';
import { updateFlowerAction } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.flowers.edit.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminFlowerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const detail = await getAdminFlowerDetail(id);
  if (!detail) {
    notFound();
  }

  const c = COPY.admin.flowers.edit;

  const action = updateFlowerAction.bind(null, id);

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-8 md:pt-12">
      <header className="space-y-3">
        <Link href="/admin/flowers" className="text-xs text-brand hover:underline">
          ← {c.backToList}
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
        <h1 className="font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {detail.name}
        </h1>
        <p className="text-xs text-ink-faint">{c.savedAt(detail.updatedAt)}</p>
      </header>

      <FlowerEditor
        initial={{
          id: detail.id,
          name: detail.name,
          nameKana: detail.nameKana,
          description: detail.description,
          defaultSeasonStart: detail.defaultSeasonStart,
          defaultSeasonEnd: detail.defaultSeasonEnd,
          images: detail.images.map((img) => ({
            url: img.url,
            caption: img.caption,
            displayOrder: img.displayOrder,
          })),
          aliases: detail.aliases.map((a) => ({ alias: a.alias })),
        }}
        action={action}
        submitLabel={c.save}
        submittingLabel={c.saving}
        cancelHref="/admin/flowers"
        cancelLabel={COPY.admin.flowers.new.cancel}
      />

      <section className="mt-12 space-y-3">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
            {c.relatedSpotsEyebrow}
          </p>
          <h2 className="mt-2 font-serif text-xl font-semibold">{c.relatedSpotsTitle}</h2>
        </header>
        {detail.relatedSpots.length === 0 ? (
          <p className="text-sm text-ink-muted">{c.relatedSpotsEmpty}</p>
        ) : (
          <>
            <p className="text-xs text-ink-muted">
              {c.relatedSpotsCount(detail.relatedSpots.length)}
            </p>
            <ul className="divide-y divide-line rounded-card border border-line bg-white">
              {detail.relatedSpots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <Link href={`/admin/spots/${s.id}`} className="font-medium hover:text-brand">
                      {s.name}
                    </Link>
                    <span className="ml-2 text-xs text-ink-muted">{s.prefectureName}</span>
                  </div>
                  <Link
                    href={`/spots/${s.id}`}
                    className="text-xs text-brand hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ↗
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="mt-12 rounded-card border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="font-serif text-base font-semibold text-destructive">{c.deleteTitle}</h2>
        <p className="mt-1 text-xs text-ink-muted">{c.deleteDialogDescription}</p>
        <div className="mt-3">
          <DeleteFlowerDialog
            flowerId={detail.id}
            flowerName={detail.name}
            triggerLabel={c.deleteButton}
            title={c.deleteDialogTitle}
            description={c.deleteDialogDescription}
            confirmLabel={c.deleteDialogConfirm}
            cancelLabel={c.deleteDialogCancel}
          />
        </div>
      </section>
    </section>
  );
}
