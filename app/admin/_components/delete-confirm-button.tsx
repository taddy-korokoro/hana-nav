'use client';

type Props = {
  label: string;
  confirmText: string;
  className?: string;
};

/**
 * `form action={...}` のサブミット前にブラウザ confirm を挟むだけの Client コンポーネント。
 * confirm をキャンセルされた場合は `event.preventDefault()` で送信を止める。
 */
export function DeleteConfirmButton({ label, confirmText, className }: Props) {
  return (
    <button
      type="submit"
      className={
        className ??
        'rounded-pill border border-destructive/40 bg-white px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10'
      }
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}
