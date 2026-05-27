import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/app/auth/_components/auth-card';
import { FormError, FormField, PrimaryButton } from '@/app/auth/_components/form-fields';
import { COPY } from '@/lib/constants/copy';
import { updatePassword } from './actions';

export const metadata: Metadata = {
  title: COPY.auth.updatePassword.metaTitle,
};

type UpdatePasswordSearchParams = Promise<{ error?: string }>;

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: UpdatePasswordSearchParams;
}) {
  return (
    <AuthCard
      eyebrow={COPY.auth.updatePassword.eyebrow}
      title={COPY.auth.updatePassword.title}
      description={COPY.auth.updatePassword.description}
    >
      {/* チケット 22 Step 1: searchParams は Suspense 内側へ。 */}
      <Suspense fallback={null}>
        <UpdatePasswordStatus searchParams={searchParams} />
      </Suspense>

      <form action={updatePassword} className="mt-4 space-y-4">
        <FormField
          label={COPY.auth.updatePassword.newPasswordLabel}
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <FormField
          label={COPY.auth.updatePassword.newPasswordConfirmLabel}
          name="password_confirm"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <PrimaryButton type="submit">{COPY.auth.updatePassword.submit}</PrimaryButton>
      </form>
    </AuthCard>
  );
}

async function UpdatePasswordStatus({
  searchParams,
}: {
  searchParams: UpdatePasswordSearchParams;
}) {
  const { error } = await searchParams;
  return <FormError message={error ? COPY.auth.updatePassword.errors[error] : null} />;
}
