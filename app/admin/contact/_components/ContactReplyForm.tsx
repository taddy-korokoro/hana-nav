'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { replyToContactAction, type ReplyActionState } from '@/app/admin/contact/actions';
import { Spinner } from '@/components/ui/spinner';
import { COPY } from '@/lib/constants/copy';

const INITIAL_STATE: ReplyActionState = { status: 'idle' };

type Props = {
  contactMessageId: string;
  defaultSubject?: string;
};

/**
 * 管理画面のお問い合わせ詳細から、SMTP 経由で返信を送るフォーム。
 *
 * - Server Action `replyToContactAction` を `useActionState` で待ち、結果に応じて
 *   バリデーション・成功・失敗の inline メッセージを切り替える。
 * - 送信ボタンは `useFormStatus` で pending 状態をスピナー表示にする。
 * - ゲスト管理者は `<fieldset disabled>`（親レイアウト）で UI 入力自体が無効化される。
 *   さらに `requireWriteAdmin()` でサーバ側からも拒否される 2 層防御。
 */
export function ContactReplyForm({ contactMessageId, defaultSubject }: Props) {
  const [state, formAction] = useActionState(replyToContactAction, INITIAL_STATE);
  const c = COPY.admin.contact.detail;

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="id" value={contactMessageId} />

      {state.formError && (
        <div
          role="alert"
          className="rounded-card border border-danger/30 bg-danger/5 p-3 text-xs text-danger"
        >
          {state.formError}
        </div>
      )}
      {state.status === 'success' && (
        <div
          role="status"
          className="rounded-card border border-success/30 bg-success/5 p-3 text-xs text-success"
        >
          {c.replySuccess}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reply-subject">
          {c.replySubjectLabel}
        </label>
        <input
          id="reply-subject"
          type="text"
          name="subject"
          required
          maxLength={200}
          defaultValue={defaultSubject ?? c.replySubjectDefault}
          className={inputClass(state.fieldErrors?.subject)}
        />
        {state.fieldErrors?.subject && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {state.fieldErrors.subject}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reply-body">
          {c.replyBodyLabel}
        </label>
        <textarea
          id="reply-body"
          name="body"
          required
          rows={10}
          maxLength={5000}
          className={inputClass(state.fieldErrors?.body, 'resize-y leading-7')}
        />
        <p className="mt-1 text-xs text-ink-muted">{c.replyBodyHelp}</p>
        {state.fieldErrors?.body && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {state.fieldErrors.body}
          </p>
        )}
      </div>

      <ReplySubmitButton />
    </form>
  );
}

function ReplySubmitButton() {
  const { pending } = useFormStatus();
  const c = COPY.admin.contact.detail;
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-card bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
    >
      {pending ? (
        <>
          <Spinner className="size-4" />
          {c.replySending}
        </>
      ) : (
        c.replySend
      )}
    </button>
  );
}

function inputClass(error?: string, extra?: string): string {
  return [
    'block w-full rounded-card border bg-white px-3 py-2 text-sm text-ink outline-none transition',
    error
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30'
      : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/20',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}
