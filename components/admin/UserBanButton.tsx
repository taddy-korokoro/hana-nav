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
import { setBanAction } from '@/app/admin/users/actions';
import { COPY } from '@/lib/constants/copy';

type Props = {
  userId: string;
  isWithdrawn: boolean;
  disabled?: boolean;
};

/**
 * BAN（profiles.deleted_at セット） / BAN 解除のボタン＋確認ダイアログ。
 * BAN するとそのユーザーは middleware の `requireAdmin` から弾かれる。
 */
export function UserBanButton({ userId, isWithdrawn, disabled }: Props) {
  const c = COPY.admin.users.detail;
  const errorMap = COPY.admin.users.errors;

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ban = !isWithdrawn;
  const triggerLabel = ban ? c.banAction.ban : c.banAction.unban;
  const confirmText = ban ? c.banAction.confirmBan : c.banAction.confirmUnban;

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('user_id', userId);
      formData.set('ban', ban ? 'true' : 'false');
      const result = await setBanAction(null, formData);
      if (result?.error) {
        setError(errorMap[result.error] ?? errorMap.update_failed);
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
        disabled={disabled}
        className={
          ban
            ? 'rounded-pill border border-destructive/40 bg-white px-3 py-1.5 text-xs text-destructive transition hover:border-destructive/60 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50'
            : 'rounded-pill border border-line bg-white px-3 py-1.5 text-xs text-ink transition hover:border-line-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50'
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
              ban
                ? 'rounded-pill bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/90 disabled:opacity-60'
                : 'rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-60'
            }
          >
            {triggerLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
