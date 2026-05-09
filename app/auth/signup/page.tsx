import type { Metadata } from 'next';
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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { error, status } = await searchParams;
  return (
    <AuthCard
      eyebrow={COPY.auth.signup.eyebrow}
      title={COPY.auth.signup.title}
      description={COPY.auth.signup.description}
      footerLabel={COPY.auth.signup.footerLabel}
      footerHref="/auth/login"
      footerCta={COPY.auth.signup.footerCta}
    >
      <FormError message={error ? COPY.auth.signup.errors[error] : null} />
      <FormSuccess message={status ? COPY.auth.signup.statuses[status] : null} />

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
