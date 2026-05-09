import type { Metadata } from 'next';
import { AuthCard } from '@/app/auth/_components/auth-card';
import {
  FormError,
  FormField,
  FormSuccess,
  PrimaryButton,
} from '@/app/auth/_components/form-fields';
import { requestReset } from './actions';

export const metadata: Metadata = {
  title: 'パスワードリセット | hana nav',
};

const errorMessages: Record<string, string> = {
  invalid_input: 'メールアドレスを入力してください。',
};

const statusMessages: Record<string, string> = {
  email_sent: '入力されたメールアドレスにリセット用リンクを送信しました（登録済みの場合のみ）。',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { error, status } = await searchParams;
  return (
    <AuthCard
      eyebrow="Reset"
      title="パスワードリセット"
      description="登録済みのメールアドレス宛にリセット用リンクを送ります。"
      footerLabel="ログイン画面に戻る場合は"
      footerHref="/auth/login"
      footerCta="ログイン"
    >
      <FormError message={error ? errorMessages[error] : null} />
      <FormSuccess message={status ? statusMessages[status] : null} />

      <form action={requestReset} className="mt-4 space-y-4">
        <FormField label="メールアドレス" name="email" type="email" required autoComplete="email" />
        <PrimaryButton type="submit">リセットメールを送る</PrimaryButton>
      </form>
    </AuthCard>
  );
}
