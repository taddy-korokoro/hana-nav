import { cacheLife } from 'next/cache';
import { Suspense } from 'react';
import { FeaturedSpots } from '@/components/home/FeaturedSpots';
import { FlowerTypeGrid } from '@/components/home/FlowerTypeGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { SearchBar } from '@/components/home/SearchBar';
import { SeasonMapClient } from '@/components/home/SeasonMapClient';
import { COPY } from '@/lib/constants/copy';
import { getFeaturedFlowers, getSeasonalSpots } from '@/lib/queries/topSpots';
import { tokyoMonth } from '@/lib/utils/dateUtils';

/**
 * トップページ。
 *
 * チケット 22 Step 2: cacheComponents 有効化（Step 4）に向けて、データ取得と
 * tokyoMonth()（new Date() 依存）の呼び出しを Suspense 境界の内側に押し下げる。
 * Page 本体は sync で、外枠 div だけが static shell に乗る構造に再編した。
 *
 * 既存の挙動は変わらない（現状は cacheComponents off）。各セクションが個別に
 * Suspense fallback を出すため、HMR 時やナビゲーション中のロード感が以前より
 * きめ細かくなる。
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeHeroAndSearch />
      </Suspense>

      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}

async function HomeHeroAndSearch() {
  'use cache';
  cacheLife('hours');
  const currentMonth = tokyoMonth();
  return (
    <>
      <HeroSection currentMonth={currentMonth} />
      <SearchBar currentMonth={currentMonth} />
    </>
  );
}

async function HomeContent() {
  'use cache';
  cacheLife('hours');
  const currentMonth = tokyoMonth();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [spots, flowers] = await Promise.all([getSeasonalSpots(24), getFeaturedFlowers(12)]);
  const spotsWithCoords = spots.filter((s) => s.latitude != null && s.longitude != null);

  return (
    <>
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
    </>
  );
}

function HomeHeroSkeleton() {
  return (
    <section className="pb-10 pt-12 md:pb-16 md:pt-20">
      <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-12 w-full max-w-md animate-pulse rounded bg-surface-2 md:h-16" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-4 w-2/3 max-w-xl animate-pulse rounded bg-surface-2" />
      <div className="mt-8 h-16 w-full animate-pulse rounded-card bg-surface-2" />
    </section>
  );
}

function HomeContentSkeleton() {
  return (
    <section className="pt-16">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] w-full animate-pulse rounded-card bg-surface-2" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </section>
  );
}
