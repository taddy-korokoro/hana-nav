import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/app/auth/_components/auth-card';
import { FormError, FormField, PrimaryButton } from '@/app/auth/_components/form-fields';
import { GoogleSignInButton } from '@/app/auth/_components/google-sign-in-button';
import { login } from './actions';

export const metadata: Metadata = {
  title: 'ログイン',
};

const errorMessages: Record<string, string> = {
  invalid_credentials: 'メールアドレスまたはパスワードが正しくありません。',
  invalid_input: '入力内容に誤りがあります。',
  auth_callback_failed: 'ログイン処理に失敗しました。もう一度お試しください。',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard
      eyebrow="Login"
      title="ログイン"
      description="メールアドレスでログイン、または Google アカウントを利用してください。"
      footerLabel="アカウントをお持ちでない方は"
      footerHref="/auth/signup"
      footerCta="新規登録"
    >
      <FormError message={error ? errorMessages[error] : null} />

      <form action={login} className="mt-4 space-y-4">
        <FormField label="メールアドレス" name="email" type="email" required autoComplete="email" />
        <FormField
          label="パスワード"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <PrimaryButton type="submit">ログイン</PrimaryButton>
      </form>

      <p className="mt-3 text-right text-sm">
        <Link href="/auth/reset-password" className="text-ink-muted hover:text-brand">
          パスワードを忘れた方
        </Link>
      </p>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        または
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton />
    </AuthCard>
  );
}
