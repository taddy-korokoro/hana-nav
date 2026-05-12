'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { restoreReviewAction, softDeleteReviewAction } from '@/app/admin/reviews/actions';
import { COPY } from '@/lib/constants/copy';

type Props = {
  reviewId: string;
  isDeleted: boolean;
};

/**
 * レビュー強制論理削除 / 復元のボタン＋確認ダイアログ。
 * 公開中レビューには「論理削除」、論理削除済みには「復元」を表示する。
 */
export function ReviewModerationActions({ reviewId, isDeleted }: Props) {
  const c = COPY.admin.reviews.list;
  const errorMap = c.errors;

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const triggerLabel = isDeleted ? c.restore : c.delete;
  const confirmText = isDeleted ? c.confirmRestore : c.confirmDelete;

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('review_id', reviewId);
      const result = isDeleted
        ? await restoreReviewAction(null, formData)
        : await softDeleteReviewAction(null, formData);
      if (result?.error) {
        setError(errorMap[result.error] ?? errorMap.delete_failed);
      } else {
        setError(null);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className={
          isDeleted
            ? 'rounded-pill border border-line bg-white px-3 py-1 text-xs text-ink transition hover:border-line-strong hover:bg-surface-2'
            : 'rounded-pill border border-destructive/40 bg-white px-3 py-1 text-xs text-destructive transition hover:border-destructive/60 hover:bg-destructive/10'
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>{confirmText}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong hover:bg-surface-2 disabled:opacity-60"
          >
            {COPY.admin.spots.list.actions.deleteDialogCancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={
              isDeleted
                ? 'rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-60'
                : 'rounded-pill bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/90 disabled:opacity-60'
            }
          >
            {triggerLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
