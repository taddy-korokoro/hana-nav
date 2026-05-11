import type { Metadata } from 'next';
import { SpotEditor } from '@/components/admin/SpotEditor';
import { COPY } from '@/lib/constants/copy';
import { listAllFlowers, listPrefectures } from '@/lib/queries/admin';
import { createSpotAction } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.spots.new.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminNewSpotPage() {
  const [prefectures, flowers] = await Promise.all([listPrefectures(), listAllFlowers()]);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const c = COPY.admin.spots.new;

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-8 md:pt-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">{c.description}</p>
      </header>

      <SpotEditor
        initial={{
          isPublished: false,
          bestSeasonStart: 4,
          bestSeasonEnd: 5,
          images: [],
          flowers: [],
        }}
        prefectures={prefectures}
        flowers={flowers}
        mapsApiKey={mapsApiKey}
        action={createSpotAction}
        submitLabel={c.submit}
        submittingLabel={c.submitting}
        cancelHref="/admin/spots"
        cancelLabel={c.cancel}
      />
    </section>
  );
}
