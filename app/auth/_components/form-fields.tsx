import type { InputHTMLAttributes } from 'react';

/**
 * 認証フォーム共通の入力フィールド。design.md のトークン（rounded-card, line,
 * brand）に揃え、shadcn の bg-primary 系を避けてブランド色と整合させる。
 */
export function FormField({
  label,
  name,
  type = 'text',
  ...rest
}: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        name={name}
        className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        {...rest}
      />
    </label>
  );
}

/** 認証フォーム共通の brand 塗り CTA ボタン。 */
export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="inline-flex w-full items-center justify-center rounded-card bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
      {...rest}
    >
      {children}
    </button>
  );
}

/** Server Action のエラーメッセージ表示（shadcn の destructive トークン経由）。 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-card bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

/** Server Action の成功メッセージ表示（brand-soft で控えめに）。 */
export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-card bg-brand-soft px-3 py-2 text-sm text-brand" role="status">
      {message}
    </p>
  );
}
