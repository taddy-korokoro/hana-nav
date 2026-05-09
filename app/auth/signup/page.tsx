import type { Metadata } from 'next';
import { AuthCard } from '@/app/auth/_components/auth-card';
import {
  FormError,
  FormField,
  FormSuccess,
  PrimaryButton,
} from '@/app/auth/_components/form-fields';
import { GoogleSignInButton } from '@/app/auth/_components/google-sign-in-button';
import { signup } from './actions';

export const metadata: Metadata = {
  title: '新規登録',
};

const errorMessages: Record<string, string> = {
  invalid_input: '入力内容に誤りがあります。',
  password_mismatch: 'パスワードが一致しません。',
  password_too_short: 'パスワードは 8 文字以上で入力してください。',
  signup_failed: '登録に失敗しました。メールアドレスを確認してください。',
};

const statusMessages: Record<string, string> = {
  email_sent:
    '入力されたメールアドレスに確認メールを送信しました。メール内のリンクからログインを完了してください。',
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { error, status } = await searchParams;
  return (
    <AuthCard
      eyebrow="Sign Up"
      title="新規登録"
      description="hana nav でブックマーク・レビュー・しおり生成をお楽しみください。"
      footerLabel="すでにアカウントをお持ちの方は"
      footerHref="/auth/login"
      footerCta="ログイン"
    >
      <FormError message={error ? errorMessages[error] : null} />
      <FormSuccess message={status ? statusMessages[status] : null} />

      <form action={signup} className="mt-4 space-y-4">
        <FormField label="メールアドレス" name="email" type="email" required autoComplete="email" />
        <FormField
          label="パスワード（8 文字以上）"
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <FormField
          label="パスワード（確認）"
          name="password_confirm"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <PrimaryButton type="submit">登録する</PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        または
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton />
    </AuthCard>
  );
}
