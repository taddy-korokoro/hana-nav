'use client';

import { useId, useState } from 'react';
import { COPY } from '@/lib/constants/copy';
import { withdraw } from '../actions';

/**
 * 退会セクション。誤操作を避けるため 2 段階：
 *   1. 「退会する」ボタンを押すと確認 UI が展開
 *   2. 同意チェックボックス + 確認テキスト一致で送信ボタンが有効化
 * 送信は Server Action `withdraw` を直接 form action として呼ぶ。
 */
export function WithdrawSection({ errorMessage }: { errorMessage?: string | null }) {
  const [open, setOpen] = useState(Boolean(errorMessage));
  const [agreed, setAgreed] = useState(false);
  const [phrase, setPhrase] = useState('');

  const expected = COPY.mypage.top.withdraw.phrase;
  const ready = agreed && phrase.trim() === expected;

  const formId = useId();

  if (!open) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-serif text-base font-semibold text-ink-muted">
            {COPY.mypage.top.withdraw.title}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{COPY.mypage.top.withdraw.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-pill border border-line bg-white px-4 py-2 text-xs font-medium text-ink-muted transition hover:border-line-strong hover:text-ink"
        >
          {COPY.mypage.top.withdraw.title}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6">
      <p className="font-serif text-base font-semibold">{COPY.mypage.top.withdraw.title}</p>
      <p className="mt-2 text-sm text-ink-muted">{COPY.mypage.top.withdraw.description}</p>

      {errorMessage && (
        <p
          className="mt-4 rounded-card bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <form id={formId} action={withdraw} className="mt-5 space-y-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 accent-brand"
          />
          <span>{COPY.mypage.top.withdraw.confirmCheck}</span>
        </label>

        <label className="block text-sm">
          <span className="block text-ink-muted">
            {COPY.mypage.top.withdraw.confirmType(expected)}
          </span>
          <input
            type="text"
            name="confirm"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!ready}
            className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-ink-faint"
          >
            {COPY.mypage.top.withdraw.submit}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setAgreed(false);
              setPhrase('');
            }}
            className="inline-flex items-center justify-center rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-line-strong"
          >
            {COPY.mypage.top.withdraw.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
