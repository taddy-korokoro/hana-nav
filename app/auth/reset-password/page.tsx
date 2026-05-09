import type { Metadata } from 'next';
import { AuthCard } from '@/app/auth/_components/auth-card';
import {
  FormError,
  FormField,
  FormSuccess,
  PrimaryButton,
} from '@/app/auth/_components/form-fields';
import { COPY } from '@/lib/constants/copy';
import { requestReset } from './actions';

export const metadata: Metadata = {
  title: COPY.auth.resetPassword.metaTitle,
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { error, status } = await searchParams;
  return (
    <AuthCard
      eyebrow={COPY.auth.resetPassword.eyebrow}
      title={COPY.auth.resetPassword.title}
      description={COPY.auth.resetPassword.description}
      footerLabel={COPY.auth.resetPassword.footerLabel}
      footerHref="/auth/login"
      footerCta={COPY.auth.resetPassword.footerCta}
    >
      <FormError message={error ? COPY.auth.resetPassword.errors[error] : null} />
      <FormSuccess message={status ? COPY.auth.resetPassword.statuses[status] : null} />

      <form action={requestReset} className="mt-4 space-y-4">
        <FormField
          label={COPY.auth.common.emailLabel}
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <PrimaryButton type="submit">{COPY.auth.resetPassword.submit}</PrimaryButton>
      </form>
    </AuthCard>
  );
}
