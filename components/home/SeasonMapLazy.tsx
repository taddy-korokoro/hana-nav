'use client';

import { useEffect, useRef, useState } from 'react';
import { SeasonMapClient } from './SeasonMapClient';
import type { SeasonalSpot } from '@/lib/queries/topSpots';

// IntersectionObserver で viewport 300px 手前まで近づくまで Maps SDK のロードを遅延し LCP を改善する。

const ROOT_MARGIN_PX = 300;

type Props = {
  spots: SeasonalSpot[];
  apiKey: string | undefined;
};

export function SeasonMapLazy(props: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${ROOT_MARGIN_PX}px` },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  if (shouldLoad) {
    return <SeasonMapClient {...props} />;
  }

  return (
    <div
      ref={sentinelRef}
      className="relative flex h-[640px] w-full items-center justify-center overflow-hidden rounded-card-lg border border-line bg-brand-soft/30 md:h-[836px]"
      aria-label="マップ読み込み準備中"
    >
      <div className="text-center">
        <div className="mx-auto size-12 rounded-pill bg-brand/15" aria-hidden="true" />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-brand">Map</p>
        <p className="mt-2 text-sm text-ink-muted">
          {props.spots.length.toLocaleString('ja-JP')} 件のスポットを表示
        </p>
      </div>
    </div>
  );
}
