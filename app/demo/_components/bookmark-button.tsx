'use client';

import { useState } from 'react';
import { BookmarkIcon } from './icons';

export function BookmarkButton({
  initial = false,
  size = 'md',
}: {
  initial?: boolean;
  size?: 'md' | 'lg';
}) {
  const [filled, setFilled] = useState(initial);
  const wrapper = size === 'lg' ? 'size-11' : 'size-9';
  const icon = size === 'lg' ? 'size-5' : 'size-4';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setFilled((f) => !f);
      }}
      aria-label={filled ? '保存済み' : '保存'}
      className={`${wrapper} grid place-items-center rounded-pill bg-white/90 backdrop-blur transition hover:bg-white active:scale-90`}
    >
      <BookmarkIcon
        className={`${icon} transition-colors ${filled ? 'fill-brand text-brand' : 'text-ink'}`}
      />
    </button>
  );
}
