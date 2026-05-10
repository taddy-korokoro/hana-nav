'use client';

import { useState, useTransition } from 'react';
import { updateUsername } from '@/app/(site)/mypage/profile/actions';
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

  return (
    <form
      action={(formData: FormData) => {
        startTransition(() => {
          updateUsername(formData);
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium text-ink">{COPY.mypage.profile.usernameLabel}</span>
        <input
          type="text"
          name="username"
          required
          minLength={USERNAME_MIN}
          maxLength={USERNAME_MAX}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <span className="mt-1 block text-xs text-ink-muted">
          {COPY.mypage.profile.usernameHint}
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? COPY.mypage.profile.submitting : COPY.mypage.profile.submit}
      </button>
    </form>
  );
}
