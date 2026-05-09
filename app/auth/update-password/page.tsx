import type { Metadata } from 'next';
import { AuthCard } from '@/app/auth/_components/auth-card';
import { FormError, FormField, PrimaryButton } from '@/app/auth/_components/form-fields';
import { COPY } from '@/lib/constants/copy';
import { updatePassword } from './actions';

export const metadata: Metadata = {
  title: COPY.auth.updatePassword.metaTitle,
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard
      eyebrow={COPY.auth.updatePassword.eyebrow}
      title={COPY.auth.updatePassword.title}
      description={COPY.auth.updatePassword.description}
    >
      <FormError message={error ? COPY.auth.updatePassword.errors[error] : null} />

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
