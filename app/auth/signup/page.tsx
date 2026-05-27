import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/app/auth/_components/auth-card';
import {
  FormError,
  FormField,
  FormSuccess,
  PrimaryButton,
} from '@/app/auth/_components/form-fields';
import { GoogleSignInButton } from '@/app/auth/_components/google-sign-in-button';
import { COPY } from '@/lib/constants/copy';
import { signup } from './actions';

export const metadata: Metadata = {
  title: COPY.auth.signup.metaTitle,
};

type SignupSearchParams = Promise<{ error?: string; status?: string }>;

export default function SignupPage({ searchParams }: { searchParams: SignupSearchParams }) {
  return (
    <AuthCard
      eyebrow={COPY.auth.signup.eyebrow}
      title={COPY.auth.signup.title}
      description={COPY.auth.signup.description}
      footerLabel={COPY.auth.signup.footerLabel}
      footerHref="/auth/login"
      footerCta={COPY.auth.signup.footerCta}
    >
      {/* チケット 22 Step 1: searchParams を Suspense 内側へ。FormError/Success は null 時に
          何も描画しないため CLS なし。 */}
      <Suspense fallback={null}>
        <SignupStatus searchParams={searchParams} />
      </Suspense>

      <form action={signup} className="mt-4 space-y-4">
        <FormField
          label={COPY.auth.common.emailLabel}
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <FormField
          label={COPY.auth.common.passwordWithHintLabel}
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <FormField
          label={COPY.auth.common.passwordConfirmLabel}
          name="password_confirm"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <PrimaryButton type="submit">{COPY.auth.signup.submit}</PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        {COPY.auth.common.orDivider}
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton />
    </AuthCard>
  );
}

async function SignupStatus({ searchParams }: { searchParams: SignupSearchParams }) {
  const { error, status } = await searchParams;
  return (
    <>
      <FormError message={error ? COPY.auth.signup.errors[error] : null} />
      <FormSuccess message={status ? COPY.auth.signup.statuses[status] : null} />
    </>
  );
}
