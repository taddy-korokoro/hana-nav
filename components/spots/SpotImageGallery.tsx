'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CameraIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { SpotImage } from '@/lib/queries/spotDetail';
import { STATIC_BLUR_DATA_URL } from '@/lib/utils/imagePlaceholder';

type Props = {
  images: SpotImage[];
  spotName: string;
};

/**
 * カバー画像 + サムネイル列。サムネイルクリックでカバーを差し替える。
 * 画像 0 件の場合はくすみピンクのプレースホルダー（design.md のカラートークン基準）。
 */
export function SpotImageGallery({ images, spotName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-card-lg bg-gradient-to-br from-pink-300 via-rose-200 to-orange-100">
        <div className="text-center text-white/85">
          <CameraIcon className="mx-auto size-10" />
          <p className="mt-2 text-sm font-medium">{COPY.spotDetail.gallery.preparing}</p>
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
          alt={active.caption ?? COPY.common.photoAlt(spotName)}
          fill
          priority
          placeholder="blur"
          blurDataURL={STATIC_BLUR_DATA_URL}
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
                aria-label={COPY.spotDetail.gallery.showThumbnail(i + 1)}
                aria-pressed={isActive}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-card transition ${
                  isActive
                    ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.caption ?? COPY.spotDetail.gallery.thumbnailAlt(spotName, i + 1)}
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
