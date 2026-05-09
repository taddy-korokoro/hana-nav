'use client';

import { AdvancedMarker, APIProvider, Map, Pin } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { NavigationIcon } from '@/components/layout/icons';

type Props = {
  apiKey: string | undefined;
  latitude: number | null;
  longitude: number | null;
  spotName: string;
  location: string;
};

const DEFAULT_ZOOM = 14;
const MAP_ID = 'hana-nav-spot-detail-map';

/**
 * スポット詳細ページの地図ピン。
 * `coordinates` は私有地特定を避けるため公式駐車場/入口に統一する運用前提。
 * API キーがない / lat-lng が無い場合は地図を出さず住所のみのカードにする。
 */
export function SpotMapPin({ apiKey, latitude, longitude, spotName, location }: Props) {
  const hasCoords = latitude != null && longitude != null;
  const directionsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="overflow-hidden rounded-card-lg border border-line bg-white">
      {apiKey && hasCoords ? (
        <APIProvider apiKey={apiKey}>
          <div className="relative h-[300px] w-full md:h-[360px]">
            <Map
              mapId={MAP_ID}
              defaultCenter={{ lat: latitude, lng: longitude }}
              defaultZoom={DEFAULT_ZOOM}
              gestureHandling="greedy"
              clickableIcons={false}
              disableDefaultUI={false}
            >
              <AdvancedMarker position={{ lat: latitude, lng: longitude }}>
                <Pin background="#c66487" borderColor="#b25578" glyphColor="#ffffff" />
              </AdvancedMarker>
            </Map>
          </div>
        </APIProvider>
      ) : (
        <div className="grid h-[200px] place-items-center bg-surface-2 text-sm text-ink-muted md:h-[260px]">
          <span>地図を準備中です</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
        <div className="min-w-0">
          <p className="font-serif text-base font-semibold">{spotName}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{location}</p>
        </div>
        <Link
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          <NavigationIcon className="size-4" />
          経路を調べる
        </Link>
      </div>
    </div>
  );
}
