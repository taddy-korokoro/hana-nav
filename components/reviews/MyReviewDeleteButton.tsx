'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { COPY } from '@/lib/constants/copy';

type Props = {
  reviewId: string;
  spotName: string;
};

/**
 * マイページのレビューカードに置く削除ボタン。
 *
 * confirm() で誤操作を防ぎつつ DELETE /api/reviews/[id] を叩く。Server 側で
 * `revalidatePath('/mypage/reviews')` が走るので `router.refresh()` で
 * Server Component を再フェッチすればカードが消える。
 */
export function MyReviewDeleteButton({ reviewId, spotName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function handleClick() {
    if (busy) return;
    if (!window.confirm(COPY.spotDetail.reviews.form.deleteConfirm)) return;

    setBusy(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        toast.success(COPY.spotDetail.reviews.toast.deleted);
        router.refresh();
      } catch (err) {
        console.error('[MyReviewDeleteButton] delete failed', err);
        toast.error(COPY.spotDetail.reviews.toast.deleteFailed);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={COPY.mypage.reviews.deleteAria(spotName)}
      className="inline-flex items-center justify-center rounded-pill px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? COPY.spotDetail.reviews.form.deleting : COPY.mypage.reviews.delete}
    </button>
  );
}
