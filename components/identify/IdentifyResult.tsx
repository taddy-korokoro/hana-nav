'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, FlowerIcon, MapPinIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';
import { IDENTIFY_RESULT_STORAGE_KEY, type IdentifyApiResult } from './storage';

// sessionStorage は外部ストアなので useSyncExternalStore で同期する。
// useState + useEffect で setState すると React 19 の `react-hooks/set-state-in-effect`
// に引っ掛かる。SSR スナップショットは常に null（サーバーでは読めない）。
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}
function getSnapshot(): string | null {
  return window.sessionStorage.getItem(IDENTIFY_RESULT_STORAGE_KEY);
}
function getServerSnapshot(): string | null {
  return null;
}

const PLACEHOLDER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-orange-100',
  'from-violet-300 via-purple-200 to-fuchsia-100',
  'from-sky-300 via-blue-200 to-cyan-100',
  'from-orange-300 via-amber-200 to-yellow-100',
  'from-rose-300 via-pink-200 to-amber-100',
];

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function IdentifyResult() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const data = useMemo<IdentifyApiResult | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as IdentifyApiResult;
    } catch {
      return null;
    }
  }, [raw]);

  if (data === null) {
    return (
      <div className="rounded-card-lg border border-line bg-white p-10 text-center">
        <p className="font-serif text-lg font-bold">{COPY.identify.result.noData.title}</p>
        <p className="mt-2 text-sm text-ink-muted">{COPY.identify.result.noData.description}</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/identify">{COPY.identify.result.noData.cta}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ai = data.ai_result;
  const flower = data.flower_master;
  const lowConfidence =
    typeof ai.confidence === 'number' && ai.confidence < LOW_CONFIDENCE_THRESHOLD;

  if (ai.is_flower === false) {
    return (
      <div className="rounded-card-lg border border-line bg-white p-10 text-center">
        <p className="font-serif text-lg font-bold">{COPY.identify.result.notFlower.title}</p>
        <p className="mt-2 text-sm text-ink-muted">{COPY.identify.result.notFlower.description}</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/identify">{COPY.identify.result.backToIdentify}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const heroImage = data.flower_images[0]?.url ?? null;
  const displayName = ai.flower_variety || flower?.name || ai.flower_name || '不明な花';

  return (
    <div className="space-y-8">
      {lowConfidence && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm">
          {COPY.identify.result.confidence.lowNotice}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card-lg bg-surface-2">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={COPY.common.photoAlt(displayName)}
              fill
              priority
              sizes="(min-width: 768px) 480px, 100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="size-full bg-gradient-to-br from-pink-300 via-rose-200 to-orange-100"
              aria-hidden
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted">
            <FlowerIcon className="size-4 text-brand" />
            {COPY.identify.result.eyebrow}
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
            {displayName}
          </h1>
          {flower && flower.name !== displayName && (
            <p className="text-sm text-ink-muted">総称: {flower.name}</p>
          )}
          <dl className="grid grid-cols-2 gap-4 rounded-card border border-line bg-white p-4">
            {typeof ai.confidence === 'number' && (
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ink-faint">
                  {COPY.identify.result.confidence.label}
                </dt>
                <dd className="mt-1 font-serif text-xl font-bold">
                  {COPY.identify.result.confidence.formatted(ai.confidence)}
                </dd>
              </div>
            )}
            {ai.bloom_status && (
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ink-faint">
                  {COPY.identify.result.bloomStatus}
                </dt>
                <dd className="mt-1 font-serif text-xl font-bold">{ai.bloom_status}</dd>
              </div>
            )}
            {ai.best_viewing_months && (
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-ink-faint">
                  {COPY.identify.result.sections.viewingMonths}
                </dt>
                <dd className="mt-1 text-sm">{ai.best_viewing_months}</dd>
              </div>
            )}
          </dl>

          {flower && (
            <Link
              href={`/flowers/${flower.id}`}
              className="inline-flex items-center gap-1 text-sm text-brand underline-offset-4 hover:underline"
            >
              {COPY.identify.result.flowerLink}
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
      </section>

      {!flower && (
        <div className="rounded-card border border-line bg-white p-5">
          <p className="font-serif text-base font-bold">{COPY.identify.result.unmatched.title}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {COPY.identify.result.unmatched.description}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {ai.description && (
          <Card title={COPY.identify.result.sections.description} body={ai.description} />
        )}
        {ai.flower_language && (
          <Card title={COPY.identify.result.sections.flowerLanguage} body={ai.flower_language} />
        )}
        {ai.fun_fact && <Card title={COPY.identify.result.sections.funFact} body={ai.fun_fact} />}
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Spots</p>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">
              {COPY.identify.result.sections.recommendedSpots}
            </h2>
          </div>
        </div>
        {flower && data.recommended_spots.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended_spots.map((spot, i) => (
              <Link key={spot.id} href={`/spots/${spot.id}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-card">
                  {spot.cover_image_url ? (
                    <Image
                      src={spot.cover_image_url}
                      alt={COPY.common.photoAlt(spot.name)}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`size-full bg-gradient-to-br ${
                        PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]
                      }`}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base font-semibold">{spot.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
                      <MapPinIcon className="size-3.5" />
                      {spot.prefecture_name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {COPY.common.seasonPrefix}{' '}
                      {formatSeasonRange(spot.best_season_start, spot.best_season_end)}
                    </p>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-card border border-line bg-white p-6 text-sm text-ink-muted">
            {COPY.identify.result.noSpots}
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <Button asChild>
          <Link href="/story-card">{COPY.identify.result.storyCardCta}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/identify">{COPY.identify.result.backToIdentify}</Link>
        </Button>
      </div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">{title}</p>
      <p className="mt-2 text-sm leading-7 text-ink">{body}</p>
    </div>
  );
}
