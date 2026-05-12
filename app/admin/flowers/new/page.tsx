import type { Metadata } from 'next';
import { FlowerEditor } from '@/components/admin/FlowerEditor';
import { COPY } from '@/lib/constants/copy';
import { createFlowerAction } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.flowers.new.metaTitle,
  robots: { index: false, follow: false },
};

export default function AdminNewFlowerPage() {
  const c = COPY.admin.flowers.new;

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-8 md:pt-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">{c.description}</p>
      </header>

      <FlowerEditor
        initial={{
          name: '',
          nameKana: null,
          description: null,
          defaultSeasonStart: null,
          defaultSeasonEnd: null,
          images: [],
          aliases: [],
        }}
        action={createFlowerAction}
        submitLabel={c.submit}
        submittingLabel={c.submitting}
        cancelHref="/admin/flowers"
        cancelLabel={c.cancel}
      />
    </section>
  );
}
