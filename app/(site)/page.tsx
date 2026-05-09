import { Suspense } from 'react';
import { FeaturedSpots } from '@/components/home/FeaturedSpots';
import { FlowerTypeGrid } from '@/components/home/FlowerTypeGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { SearchBar } from '@/components/home/SearchBar';
import { SeasonMap } from '@/components/home/SeasonMap';
import { getFeaturedFlowers, getSeasonalSpots } from '@/lib/queries/topSpots';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const currentMonth = new Date().getMonth() + 1;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [spots, flowers] = await Promise.all([getSeasonalSpots(24), getFeaturedFlowers(12)]);
  const spotsWithCoords = spots.filter((s) => s.latitude != null && s.longitude != null);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <HeroSection currentMonth={currentMonth} />
      <SearchBar currentMonth={currentMonth} />

      {apiKey && spotsWithCoords.length > 0 && (
        <section className="pt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Map view</p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">
                今月見頃のマップ
              </h2>
            </div>
          </div>
          <div className="mt-6">
            <Suspense
              fallback={
                <div className="h-[420px] w-full rounded-card-lg bg-surface-2 md:h-[520px]" />
              }
            >
              <SeasonMap spots={spotsWithCoords} apiKey={apiKey} />
            </Suspense>
          </div>
        </section>
      )}

      <FeaturedSpots spots={spots} currentMonth={currentMonth} />
      <FlowerTypeGrid flowers={flowers} />
    </div>
  );
}
