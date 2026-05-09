'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { COPY } from '@/lib/constants/copy';

/**
 * マイページ一覧の各カードに重ねる「保存を解除」ボタン。
 * 楽観的に非表示化したいので親で表示状態を持たせず、ボタン自体が消える表現は
 * router.refresh() 後のリスト再生成に任せる。失敗時はロールバックして元に戻す。
 */
export function BookmarkRemoveButton({ spotId, spotName }: { spotId: string; spotName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const handleClick = () => {
    if (isPending) return;
    setHidden(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/bookmarks/${spotId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        toast.success(COPY.bookmark.toast.removed);
        router.refresh();
      } catch (error) {
        console.error('[BookmarkRemoveButton] failed', error);
        setHidden(false);
        toast.error(COPY.bookmark.toast.removeFailed);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={COPY.bookmark.list.removeAria(spotName)}
      className="rounded-pill bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75 disabled:opacity-60"
    >
      {COPY.bookmark.list.remove}
    </button>
  );
}
