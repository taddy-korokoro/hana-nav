import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthCard } from '@/app/auth/_components/auth-card';
import { FormError, FormField, PrimaryButton } from '@/app/auth/_components/form-fields';
import { GoogleSignInButton } from '@/app/auth/_components/google-sign-in-button';
import { COPY } from '@/lib/constants/copy';
import { login } from './actions';

export const metadata: Metadata = {
  title: COPY.auth.login.metaTitle,
};

type LoginSearchParams = Promise<{ error?: string }>;

export default function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  return (
    <AuthCard
      eyebrow={COPY.auth.login.eyebrow}
      title={COPY.auth.login.title}
      description={COPY.auth.login.description}
      footerLabel={COPY.auth.login.footerLabel}
      footerHref="/auth/signup"
      footerCta={COPY.auth.login.footerCta}
    >
      {/* searchParams は request-time data なので Suspense 境界の内側に閉じ込め、
          cacheComponents 有効下の prerender 拒否を回避する。FormError は null 時に
          何もレンダリングしないため fallback={null} で CLS は発生しない。 */}
      <Suspense fallback={null}>
        <LoginStatus searchParams={searchParams} />
      </Suspense>

      <form action={login} className="mt-4 space-y-4">
        <FormField
          label={COPY.auth.common.emailLabel}
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <FormField
          label={COPY.auth.common.passwordLabel}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
        />
        <PrimaryButton type="submit">{COPY.auth.login.submit}</PrimaryButton>
      </form>

      <p className="mt-3 text-right text-sm">
        <Link href="/auth/reset-password" className="text-ink-muted hover:text-brand">
          {COPY.auth.login.forgotPassword}
        </Link>
      </p>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        {COPY.auth.common.orDivider}
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton />
    </AuthCard>
  );
}

async function LoginStatus({ searchParams }: { searchParams: LoginSearchParams }) {
  const { error } = await searchParams;
  return <FormError message={error ? COPY.auth.login.errors[error] : null} />;
}
