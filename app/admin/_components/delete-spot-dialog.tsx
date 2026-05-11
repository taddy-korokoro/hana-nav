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
import { softDeleteSpotAction } from '@/app/admin/spots/actions';

type Props = {
  spotId: string;
  spotName: string;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  redirectTo?: string;
  triggerClassName?: string;
};

/**
 * スポット削除の確認モーダル。トリガーは「削除」ボタンで、開いたモーダル内で
 * もう一度「削除する」を押して確定する 2 ステップ確認。
 */
export function DeleteSpotDialog({
  spotId,
  spotName,
  triggerLabel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  redirectTo = '/admin/spots',
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('spot_id', spotId);
      formData.set('redirect_to', redirectTo);
      await softDeleteSpotAction(formData);
      // 通常は redirect で遷移するためここに到達しない。フォールバックで close
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className={
          triggerClassName ??
          'rounded-pill border border-destructive/40 bg-white px-3 py-1 text-xs text-destructive hover:bg-destructive/10'
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            <span className="mt-2 block break-all font-medium text-ink">{spotName}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-pill bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/90 disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
