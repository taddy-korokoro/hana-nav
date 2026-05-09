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
import type { SpotSearchResult } from '@/lib/queries/spotSearch';

const JAPAN_CENTER = { lat: 36.5, lng: 138.5 };
const DEFAULT_ZOOM = 5;
const MAP_ID = 'hana-nav-spots-map';

type Props = {
  spots: SpotSearchResult[];
  apiKey: string | undefined;
};

/**
 * /spots?view=map のピン表示。座標ありのスポットだけプロットし、クラスタリング・
 * ピンクリックで InfoWindow を出す。API キー未設定の場合は呼び出し元でこのコンポーネント
 * 自体を出さない（フォールバックでリストを表示する）。
 */
export function SpotMapView({ spots, apiKey }: Props) {
  if (!apiKey) return null;

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-[480px] w-full overflow-hidden rounded-card-lg border border-line bg-white md:h-[640px]">
        <Map
          mapId={MAP_ID}
          defaultCenter={JAPAN_CENTER}
          defaultZoom={DEFAULT_ZOOM}
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

function ClusteredMarkers({ spots }: { spots: SpotSearchResult[] }) {
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
          <div className="min-w-[200px] max-w-[240px] p-1">
            <p className="font-serif text-base font-semibold text-ink">{active.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {active.prefectureName}
              {active.flowerNames.length > 0 && ` ・ ${active.flowerNames.slice(0, 2).join('・')}`}
            </p>
            <Link
              href={`/spots/${active.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover"
            >
              詳細を見る
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
