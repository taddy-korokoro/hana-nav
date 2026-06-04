'use client';

import { useFormStatus } from 'react-dom';
import { Spinner } from '@/components/ui/spinner';

/**
 * ゲスト管理者ログイン用のサブミットボタン。PrimaryButton と同じ useFormStatus パターンで
 * 送信中は Spinner を出し disabled にする。styling は他の認証ボタン（GoogleSignInButton 等）に
 * 揃えたサブ系（surface 色 + 細枠）。
 */
export function GuestLoginButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="inline-flex w-full items-center justify-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner size="sm" label={null} />}
      {label}
    </button>
  );
}
