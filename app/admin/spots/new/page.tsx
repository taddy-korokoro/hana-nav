import type { Metadata } from 'next';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { SpotEditor } from '@/components/admin/SpotEditor';
import { COPY } from '@/lib/constants/copy';
import { listAllFlowers, listPrefectures } from '@/lib/queries/admin';
import { createSpotAction } from '../actions';


export const metadata: Metadata = {
  title: COPY.admin.spots.new.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminNewSpotPage() {
  const [prefectures, flowers] = await Promise.all([listPrefectures(), listAllFlowers()]);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const c = COPY.admin.spots.new;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

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
