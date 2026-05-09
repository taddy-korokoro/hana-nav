import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/app/auth/_components/auth-card';
import { FormError, FormField, PrimaryButton } from '@/app/auth/_components/form-fields';
import { GoogleSignInButton } from '@/app/auth/_components/google-sign-in-button';
import { COPY } from '@/lib/constants/copy';
import { login } from './actions';

export const metadata: Metadata = {
  title: COPY.auth.login.metaTitle,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard
      eyebrow={COPY.auth.login.eyebrow}
      title={COPY.auth.login.title}
      description={COPY.auth.login.description}
      footerLabel={COPY.auth.login.footerLabel}
      footerHref="/auth/signup"
      footerCta={COPY.auth.login.footerCta}
    >
      <FormError message={error ? COPY.auth.login.errors[error] : null} />

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
