'use client';

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { COPY } from '@/lib/constants/copy';

type Props = {
  apiKey: string | undefined;
  initialLatitude: number | null;
  initialLongitude: number | null;
  onChange: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER = { lat: 35.681236, lng: 139.767125 }; // 東京駅
const DEFAULT_ZOOM = 5;

/**
 * 緯度経度ピッカー。地図クリックでピンを移動し、親に通知する。
 * API キーが無い環境ではフォールバックとして手入力を促すヒントを表示する。
 */
export function CoordinatePicker({ apiKey, initialLatitude, initialLongitude, onChange }: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initialLatitude != null && initialLongitude != null
      ? { lat: initialLatitude, lng: initialLongitude }
      : null,
  );

  if (!apiKey) {
    return (
      <div className="rounded-card border border-dashed border-line bg-surface-2 p-4 text-sm text-ink-muted">
        {COPY.admin.spots.editor.coordinateHelp}
      </div>
    );
  }

  const handleClick = (e: MapMouseEvent) => {
    const { latLng } = e.detail;
    if (!latLng) return;
    const next = { lat: latLng.lat, lng: latLng.lng };
    setPos(next);
    onChange(next.lat, next.lng);
  };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-[320px] w-full overflow-hidden rounded-card border border-line">
        <Map
          mapId="hana-nav-admin-coordinate-picker"
          defaultCenter={pos ?? DEFAULT_CENTER}
          defaultZoom={pos ? 13 : DEFAULT_ZOOM}
          gestureHandling="greedy"
          clickableIcons={false}
          onClick={handleClick}
        >
          {pos && (
            <AdvancedMarker position={pos}>
              <Pin background="#c66487" borderColor="#b25578" glyphColor="#ffffff" />
            </AdvancedMarker>
          )}
        </Map>
      </div>
      <p className="mt-2 text-xs text-ink-muted">{COPY.admin.spots.editor.coordinateHelp}</p>
    </APIProvider>
  );
}
