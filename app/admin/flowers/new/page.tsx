import type { Metadata } from 'next';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { FlowerEditor } from '@/components/admin/FlowerEditor';
import { COPY } from '@/lib/constants/copy';
import { createFlowerAction } from '../actions';


export const metadata: Metadata = {
  title: COPY.admin.flowers.new.metaTitle,
  robots: { index: false, follow: false },
};

export default function AdminNewFlowerPage() {
  const c = COPY.admin.flowers.new;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

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
