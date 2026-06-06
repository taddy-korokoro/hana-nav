'use client';

import { useEffect, useRef, useState } from 'react';
import { SeasonMapClient } from './SeasonMapClient';
import type { SeasonalSpot } from '@/lib/queries/topSpots';

/**
 * トップ画面の Google Maps を **IntersectionObserver で遅延ロード** するラッパー。
 *
 * 背景: Lighthouse 計測で LCP 9.2 秒（PageSpeed Insights 2026-06-07）になり、
 * 主因が above-the-fold の Google Maps だった（高さ 640〜836px で初期表示領域を
 * 占有）。SeasonMapClient は既に `dynamic(ssr:false)` でチャンク分離されているが、
 * hydration 直後に即読み込まれるため LCP 候補から外せない。
 *
 * 本コンポーネントが Container をマウントした時点では Maps SDK のロードは
 * **トリガーしない**。スクロールでマップセクションが viewport の手前 300px に
 * 入った時点で初めて `SeasonMapClient` を render → Maps SDK ロード開始。
 *
 * 効果:
 * - LCP 候補が Hero 文字 / SearchBar に切り替わり、Map は初期 LCP から除外される
 * - 初期 JS バンドルから Maps SDK 由来の評価コストが排除される（TBT 改善）
 * - 一度マップを描画したらこの wrapper の役目は終わり（disconnect）
 *
 * CLS:
 * - placeholder の高さは SeasonMap 本体の Container（h-[640px] / md:h-[836px]）と
 *   一致させて、マップに切り替わった時のレイアウトシフトを回避する。
 */

const ROOT_MARGIN_PX = 300;

type Props = {
  spots: SeasonalSpot[];
  apiKey: string | undefined;
};

export function SeasonMapLazy(props: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldLoad) return;
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
  }, [shouldLoad]);

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
