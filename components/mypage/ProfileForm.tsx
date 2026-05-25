'use client';

import { useId, useState, useTransition } from 'react';
import { updateUsername } from '@/app/(site)/mypage/profile/actions';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';
import { USERNAME_MAX, USERNAME_MIN } from '@/lib/utils/usernameValidator';

type Props = {
  initialUsername: string;
};

/**
 * username 編集フォーム。Server Action `updateUsername` を `<form action={...}>` で呼び、
 * Server 側でバリデーション・UNIQUE 違反検知・redirect を行う。
 *
 * Client Component にしているのは、長さカウンターと送信中の disabled 表示のためのみ。
 * 入力値は state で持つが、送信は FormData ベース（CLAUDE.md「Mutation は Server Actions」）。
 */
export function ProfileForm({ initialUsername }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [pending, startTransition] = useTransition();
  const fieldId = useId();
  const inputId = `${fieldId}-username`;
  const hintId = `${fieldId}-username-hint`;

  return (
    <form
      action={(formData: FormData) => {
        startTransition(() => {
          updateUsername(formData);
        });
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {COPY.mypage.profile.usernameLabel}
        </label>
        <input
          id={inputId}
          type="text"
          name="username"
          required
          minLength={USERNAME_MIN}
          maxLength={USERNAME_MAX}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          aria-describedby={hintId}
          className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-line-strong"
        />
        <span id={hintId} className="mt-1 block text-xs text-ink-muted">
          {COPY.mypage.profile.usernameHint}
        </span>
      </div>

      <Button type="submit" loading={pending} loadingText={COPY.mypage.profile.submitting}>
        {COPY.mypage.profile.submit}
      </Button>
    </form>
  );
}
