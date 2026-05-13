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
import { changeRoleAction } from '@/app/admin/users/actions';
import { COPY } from '@/lib/constants/copy';

type Props = {
  userId: string;
  currentRole: 'user' | 'admin';
  disabled?: boolean;
  isWithdrawn?: boolean;
};

/**
 * ユーザーのロール変更（user ⇄ admin）ボタン＋確認ダイアログ。
 * Server Action `changeRoleAction` を transition で呼ぶ。
 */
export function UserRoleSelector({ userId, currentRole, disabled, isWithdrawn }: Props) {
  const c = COPY.admin.users.detail;
  const errorMap = COPY.admin.users.errors;

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextRole: 'user' | 'admin' = currentRole === 'admin' ? 'user' : 'admin';
  const triggerLabel =
    currentRole === 'admin' ? c.roleAction.demoteToUser : c.roleAction.promoteToAdmin;
  const confirmText =
    currentRole === 'admin' ? c.roleAction.confirmDemote : c.roleAction.confirmPromote;

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('user_id', userId);
      formData.set('next_role', nextRole);
      const result = await changeRoleAction(null, formData);
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
        disabled={disabled || isWithdrawn}
        className="rounded-pill border border-line bg-white px-3 py-1.5 text-xs text-ink transition hover:border-line-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-60"
          >
            {triggerLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
