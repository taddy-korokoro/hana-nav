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
import { softDeleteFlowerAction } from '@/app/admin/flowers/actions';

type Props = {
  flowerId: string;
  flowerName: string;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  triggerClassName?: string;
};

/**
 * 花マスター削除の確認モーダル。spot 版と同じ 2 ステップ確認。
 */
export function DeleteFlowerDialog({
  flowerId,
  flowerName,
  triggerLabel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('flower_id', flowerId);
      await softDeleteFlowerAction(formData);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className={
          triggerClassName ??
          'rounded-pill border border-destructive/40 bg-white px-3 py-1 text-xs text-destructive transition hover:border-destructive/60 hover:bg-destructive/10'
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            <span className="mt-2 block break-all font-medium text-ink">{flowerName}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong hover:bg-surface-2 disabled:opacity-60"
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
