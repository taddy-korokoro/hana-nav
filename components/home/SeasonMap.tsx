'use client';

import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { SeasonalSpot } from '@/lib/queries/topSpots';

const JAPAN_CENTER = { lat: 38, lng: 138.5 };
const DEFAULT_ZOOM = 5;
const MIN_ZOOM = 4;
const MAP_ID = 'hana-nav-season-map';

// パン制限用の矩形：操作中に海外側へドラッグできないようにする。
// strictBounds: true との組み合わせで、コンテナ高さがこの矩形より縦方向に長いと
// Google Maps が表示範囲を矩形に合わせて自動でズームインしてしまう。
// → 縦に余裕を持たせて北海道（最北 ~45.5°）が確実に収まるよう north を引き上げ。
const JAPAN_BOUNDS = {
  south: 16,
  west: 118,
  north: 52,
  east: 152,
};

type Props = {
  spots: SeasonalSpot[];
  apiKey: string | undefined;
};

/**
 * 今月見頃マップ。Google Maps API キーが無い、または対象スポットが 0 件のときは
 * Server 側で何も渡されないため、呼び出し元（page.tsx）で <SeasonMap> 自体を出さない設計。
 * ピン密集地ではクラスタリングし、ピンクリックで簡易カードを表示する。
 */
export function SeasonMap({ spots, apiKey }: Props) {
  if (!apiKey) return null;

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-[640px] w-full overflow-hidden rounded-card-lg border border-line bg-white md:h-[836px]">
        <Map
          mapId={MAP_ID}
          defaultCenter={JAPAN_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          minZoom={MIN_ZOOM}
          restriction={{ latLngBounds: JAPAN_BOUNDS, strictBounds: true }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
        >
          <ClusteredMarkers spots={spots} />
        </Map>
      </div>
    </APIProvider>
  );
}

function ClusteredMarkers({ spots }: { spots: SeasonalSpot[] }) {
  const map = useMap();
  const [activeId, setActiveId] = useState<string | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map });
    }
  }, [map]);

  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;
    clusterer.clearMarkers();
    const markers = Object.values(markersRef.current).filter(Boolean);
    if (markers.length > 0) clusterer.addMarkers(markers);
  }, [spots]);

  const setMarkerRef = (marker: Marker | null, id: string) => {
    if (marker) {
      markersRef.current[id] = marker;
    } else {
      delete markersRef.current[id];
    }
  };

  const active = activeId ? (spots.find((s) => s.id === activeId) ?? null) : null;

  return (
    <>
      {spots.map((spot) => {
        if (spot.latitude == null || spot.longitude == null) return null;
        return (
          <AdvancedMarker
            key={spot.id}
            position={{ lat: spot.latitude, lng: spot.longitude }}
            ref={(marker) => setMarkerRef(marker, spot.id)}
            onClick={() => setActiveId(spot.id)}
          >
            <Pin background="#c66487" borderColor="#b25578" glyphColor="#ffffff" />
          </AdvancedMarker>
        );
      })}

      {active && active.latitude != null && active.longitude != null && (
        <InfoWindow
          position={{ lat: active.latitude, lng: active.longitude }}
          onCloseClick={() => setActiveId(null)}
          pixelOffset={[0, -34]}
        >
          {/* pr-6: 上余白を詰めるため close button (24px) を絶対配置にしているので
              右端で重なるのを避ける */}
          <div className="min-w-[200px] max-w-[240px] p-1 pr-6">
            <p className="font-serif text-base font-semibold text-ink">{active.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {active.prefectureName}
              {active.flowerNames.length > 0 && ` ・ ${active.flowerNames.slice(0, 2).join('・')}`}
            </p>
            <Link
              href={`/spots/${active.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover"
            >
              {COPY.common.showDetail}
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
