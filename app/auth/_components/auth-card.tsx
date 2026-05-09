import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footerLabel?: string;
  footerHref?: string;
  footerCta?: string;
};

/**
 * 認証ページ共通の中央寄せカードレイアウト。
 * 余白・タイポは design.md のページシェル + セクションヘッダーに準拠。
 */
export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footerLabel,
  footerHref,
  footerCta,
}: AuthCardProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-card-lg bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footerLabel && footerHref && footerCta && (
        <p className="mt-6 text-center text-sm text-ink-muted">
          {footerLabel}{' '}
          <Link href={footerHref} className="font-medium text-brand hover:text-brand-hover">
            {footerCta}
          </Link>
        </p>
      )}
    </main>
  );
}
