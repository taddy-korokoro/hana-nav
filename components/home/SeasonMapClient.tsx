'use client';

import dynamic from 'next/dynamic';
import type { SeasonalSpot } from '@/lib/queries/topSpots';

// SeasonMap は @vis.gl/react-google-maps / @googlemaps/markerclusterer を使い、
// 初期化時に window / document を参照する。Server Component から ssr:false を
// 渡せない仕様（Next.js 14+）のため、Client Component のラッパー越しに ssr:false で
// 動的読み込みする。これにより初期 JS バンドル削減と SSR 時の window 参照回避を
// 両立する。
// loading の高さは SeasonMap 本体の Container および SeasonMapLazy の placeholder と
// 同じ h-[640px] / md:h-[836px] に揃える。違うと SDK チャンクのダウンロード中に
// placeholder → loading skeleton → 実 Map の各段で高さが揺れて CLS が発生する。
const SeasonMap = dynamic(() => import('./SeasonMap').then((m) => ({ default: m.SeasonMap })), {
  ssr: false,
  loading: () => (
    <div
      className="h-[640px] w-full rounded-card-lg bg-surface-2 md:h-[836px]"
      aria-hidden="true"
    />
  ),
});

type Props = {
  spots: SeasonalSpot[];
  apiKey: string | undefined;
};

export function SeasonMapClient(props: Props) {
  return <SeasonMap {...props} />;
}
