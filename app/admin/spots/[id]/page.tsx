import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { SpotEditor } from '@/components/admin/SpotEditor';
import { COPY } from '@/lib/constants/copy';
import { getAdminSpotDetail, listAllFlowers, listPrefectures } from '@/lib/queries/admin';
import { updateSpotAction } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.spots.edit.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminSpotEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [detail, prefectures, flowers] = await Promise.all([
    getAdminSpotDetail(id),
    listPrefectures(),
    listAllFlowers(),
  ]);

  if (!detail) {
    notFound();
  }

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const c = COPY.admin.spots.edit;

  const action = updateSpotAction.bind(null, id);

  return (
    <section className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <AdminPageHeader
        eyebrow={c.eyebrow}
        title={detail.name}
        backLink={{ href: '/admin/spots', label: c.backToList }}
        meta={<p className="text-xs text-ink-faint">{c.savedAt(detail.updatedAt)}</p>}
      />

      <SpotEditor
        initial={{
          id: detail.id,
          name: detail.name,
          nameKana: detail.nameKana,
          description: detail.description,
          prefectureId: detail.prefectureId,
          location: detail.location,
          latitude: detail.latitude ?? undefined,
          longitude: detail.longitude ?? undefined,
          officialUrl: detail.officialUrl,
          source: detail.source,
          accessInfo: detail.accessInfo,
          parkingInfo: detail.parkingInfo,
          entranceFee: detail.entranceFee,
          bestSeasonStart: detail.bestSeasonStart,
          bestSeasonEnd: detail.bestSeasonEnd,
          isPublished: detail.isPublished,
          images: detail.images.map((img) => ({
            url: img.url,
            caption: img.caption,
            displayOrder: img.displayOrder,
          })),
          flowers: detail.flowers.map((f) => ({
            flowerId: f.flowerId,
            bloomStartMonth: f.bloomStartMonth,
            bloomEndMonth: f.bloomEndMonth,
          })),
        }}
        prefectures={prefectures}
        flowers={flowers}
        mapsApiKey={mapsApiKey}
        action={action}
        submitLabel={c.save}
        submittingLabel={c.saving}
        cancelHref="/admin/spots"
        cancelLabel={COPY.admin.spots.new.cancel}
      />
    </section>
  );
}
