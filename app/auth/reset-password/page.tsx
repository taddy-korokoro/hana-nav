import type { Metadata } from 'next';
import { Suspense } from 'react';
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

type ResetPasswordSearchParams = Promise<{ error?: string; status?: string }>;

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: ResetPasswordSearchParams;
}) {
  return (
    <AuthCard
      eyebrow={COPY.auth.resetPassword.eyebrow}
      title={COPY.auth.resetPassword.title}
      description={COPY.auth.resetPassword.description}
      footerLabel={COPY.auth.resetPassword.footerLabel}
      footerHref="/auth/login"
      footerCta={COPY.auth.resetPassword.footerCta}
    >
      {/* searchParams は request-time data なので Suspense 境界の内側に閉じ込める。 */}
      <Suspense fallback={null}>
        <ResetPasswordStatus searchParams={searchParams} />
      </Suspense>

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

async function ResetPasswordStatus({ searchParams }: { searchParams: ResetPasswordSearchParams }) {
  const { error, status } = await searchParams;
  return (
    <>
      <FormError message={error ? COPY.auth.resetPassword.errors[error] : null} />
      <FormSuccess message={status ? COPY.auth.resetPassword.statuses[status] : null} />
    </>
  );
}
