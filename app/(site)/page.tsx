import nextDynamic from 'next/dynamic';
import { FeaturedSpots } from '@/components/home/FeaturedSpots';
import { FlowerTypeGrid } from '@/components/home/FlowerTypeGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { SearchBar } from '@/components/home/SearchBar';
import { COPY } from '@/lib/constants/copy';
import { getFeaturedFlowers, getSeasonalSpots } from '@/lib/queries/topSpots';

// revalidate=300 を設定しているが、getSeasonalSpots / getFeaturedFlowers が
// createClient() → cookies() を呼び出すため、現状は dynamic レンダリングに
// フォールバックして ISR は発動しない。cookies() 依存を除去した時点で自動的に
// 5 分 ISR が有効になる土台として残している。
export const revalidate = 300;

// 初期バンドルから @vis.gl/react-google-maps と @googlemaps/markerclusterer を切り出す。
// SeasonMap はファーストビュー外でかつ巨大なため遅延ロードする。
const SeasonMap = nextDynamic(
  () => import('@/components/home/SeasonMap').then((m) => ({ default: m.SeasonMap })),
  {
    loading: () => (
      <div
        className="h-[420px] w-full rounded-card-lg bg-surface-2 md:h-[520px]"
        aria-hidden="true"
      />
    ),
  },
);

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
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
                {COPY.home.map.eyebrow}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">
                {COPY.home.map.title}
              </h2>
            </div>
          </div>
          <div className="mt-6">
            <SeasonMap spots={spotsWithCoords} apiKey={apiKey} />
          </div>
        </section>
      )}

      <FeaturedSpots spots={spots} currentMonth={currentMonth} />
      <FlowerTypeGrid flowers={flowers} />
    </div>
  );
}
