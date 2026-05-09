import type { Metadata } from 'next';
import { AuthCard } from '@/app/auth/_components/auth-card';
import { FormError, FormField, PrimaryButton } from '@/app/auth/_components/form-fields';
import { updatePassword } from './actions';

export const metadata: Metadata = {
  title: 'パスワード更新',
};

const errorMessages: Record<string, string> = {
  invalid_input: '入力内容に誤りがあります。',
  password_mismatch: 'パスワードが一致しません。',
  password_too_short: 'パスワードは 8 文字以上で入力してください。',
  update_failed: 'パスワードの更新に失敗しました。もう一度お試しください。',
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard
      eyebrow="Update"
      title="新しいパスワードを設定"
      description="リセットメールから遷移したセッションで新しいパスワードを設定します。"
    >
      <FormError message={error ? errorMessages[error] : null} />

      <form action={updatePassword} className="mt-4 space-y-4">
        <FormField
          label="新しいパスワード（8 文字以上）"
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <FormField
          label="新しいパスワード（確認）"
          name="password_confirm"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <PrimaryButton type="submit">パスワードを更新する</PrimaryButton>
      </form>
    </AuthCard>
  );
}
