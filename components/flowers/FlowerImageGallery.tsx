'use client';

import Image from 'next/image';
import { useState } from 'react';
import { COPY } from '@/lib/constants/copy';
import type { FlowerImage } from '@/lib/queries/flowers';

type Props = {
  images: FlowerImage[];
  flowerName: string;
};

/**
 * 花詳細ページのカバー + サムネイル列。SpotImageGallery の花版。
 * 画像 0 件のときは大きな頭文字つきグラデーション（FlowerCard と統一）にフォールバック。
 */
export function FlowerImageGallery({ images, flowerName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-card-lg bg-gradient-to-br from-pink-300 via-rose-200 to-orange-100">
        <div className="text-center text-white/85">
          <span aria-hidden className="block font-serif text-7xl font-light">
            {flowerName.slice(0, 1)}
          </span>
          <p className="mt-2 text-sm font-medium">{COPY.flowerDetail.gallery.preparing}</p>
        </div>
      </div>
    );
  }

  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card-lg bg-surface-2">
        <Image
          src={active.url}
          alt={active.caption ?? COPY.common.photoAlt(flowerName)}
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 960px, 100vw"
        />
        {active.caption && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/60 to-transparent p-4">
            <p className="text-xs text-white/90">{active.caption}</p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-pressed={isActive}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-card transition ${
                  isActive
                    ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.caption ?? COPY.common.photoAlt(flowerName)}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
