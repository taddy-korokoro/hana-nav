'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

import { Button } from '@/components/ui/button';
import { FormBanner } from '@/components/ui/form-banner';

type FormFieldProps = {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

/**
 * 認証フォーム共通の入力フィールド。design.md の「フォーム規約」に準拠し、
 * 必須マーク・aria-describedby・htmlFor を構造的に担保する。
 *
 * type="password" の場合は右側に目アイコンのトグルを置き、表示/非表示を切り替える。
 */
export function FormField({ label, name, hint, required, type = 'text', ...rest }: FormFieldProps) {
  const fieldId = useId();
  const inputId = `${fieldId}-${name}`;
  const hintId = hint ? `${fieldId}-${name}-hint` : undefined;

  const isPassword = type === 'password';
  const [revealed, setRevealed] = useState(false);
  const effectiveType = isPassword && revealed ? 'text' : type;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={inputId}
          type={effectiveType}
          name={name}
          required={required}
          aria-describedby={hintId}
          className={`w-full rounded-card border border-line bg-surface py-2.5 pl-3.5 text-sm text-ink outline-none transition-colors focus:border-line-strong ${
            isPassword ? 'pr-11' : 'pr-3.5'
          }`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'パスワードを非表示にする' : 'パスワードを表示する'}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-muted transition-colors hover:text-ink"
          >
            {revealed ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        )}
      </div>
      {hint && (
        <span id={hintId} className="mt-1 block text-xs text-ink-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

/** 認証フォーム共通の brand 塗り CTA ボタン。共通 Button のラッパ。 */
export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className={['w-full', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Button>
  );
}

/** Server Action のエラーメッセージ表示。共通 FormBanner のラッパ。 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <FormBanner variant="error">{message}</FormBanner>;
}

/** Server Action の成功メッセージ表示。共通 FormBanner のラッパ。 */
export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return <FormBanner variant="success">{message}</FormBanner>;
}
