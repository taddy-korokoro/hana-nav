import { FeaturedSpots } from '@/components/home/FeaturedSpots';
import { FlowerTypeGrid } from '@/components/home/FlowerTypeGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { SearchBar } from '@/components/home/SearchBar';
import { SeasonMapClient } from '@/components/home/SeasonMapClient';
import { COPY } from '@/lib/constants/copy';
import { getFeaturedFlowers, getSeasonalSpots } from '@/lib/queries/topSpots';
import { tokyoMonth } from '@/lib/utils/dateUtils';

export const revalidate = 300;

export default async function HomePage() {
  const currentMonth = tokyoMonth();
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
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
                {COPY.home.map.eyebrow}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">
                {COPY.home.map.title}
              </h2>
            </div>
          </div>
          <div className="mt-6">
            <SeasonMapClient spots={spotsWithCoords} apiKey={apiKey} />
          </div>
        </section>
      )}

      <FeaturedSpots spots={spots} currentMonth={currentMonth} />
      <FlowerTypeGrid flowers={flowers} />
    </div>
  );
}
