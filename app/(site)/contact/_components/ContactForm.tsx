'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitContactAction, type ContactFormState } from '@/app/(site)/contact/actions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { COPY } from '@/lib/constants/copy';
import { CONTACT_CATEGORIES, type ContactCategory } from '@/lib/contact/constants';

const MAX_MESSAGE_LENGTH = 2000;

const INITIAL_STATE: ContactFormState = { status: 'idle' };

type Props = {
  /** ログインユーザーの初期値（自動入力に使う） */
  defaultName?: string | null;
  defaultEmail?: string | null;
  /** ログイン中はメールフィールドを readonly にする */
  emailLocked?: boolean;
};

export function ContactForm({ defaultName, defaultEmail, emailLocked }: Props) {
  const [state, formAction] = useActionState(submitContactAction, INITIAL_STATE);
  const [category, setCategory] = useState<ContactCategory | ''>('');
  const [messageLength, setMessageLength] = useState(0);

  const showReferenceUrl = category === 'BUG_REPORT';

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* honeypot: bot のみが値を入れる隠しフィールド。CSS で隠す + aria-hidden + tabIndex で
          スクリーンリーダー / キーボード操作からも見えなくする。 */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {state.formError && (
        <div
          role="alert"
          className="rounded-card border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
        >
          {state.formError}
        </div>
      )}

      <Field id="name" label={COPY.contact.fields.nameLabel} required error={state.errors?.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={defaultName ?? ''}
          placeholder={COPY.contact.fields.namePlaceholder}
          className={baseInputClass(state.errors?.name)}
        />
      </Field>

      <Field
        id="email"
        label={COPY.contact.fields.emailLabel}
        required
        error={state.errors?.email}
        help={emailLocked ? COPY.contact.fields.emailHelpForLoggedIn : undefined}
      >
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail ?? ''}
          readOnly={emailLocked}
          placeholder={COPY.contact.fields.emailPlaceholder}
          className={baseInputClass(state.errors?.email, emailLocked)}
        />
      </Field>

      <Field
        id="category"
        label={COPY.contact.fields.categoryLabel}
        required
        error={state.errors?.category}
      >
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as ContactCategory | '')}
          className={baseInputClass(state.errors?.category)}
        >
          <option value="" disabled>
            —
          </option>
          {CONTACT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {COPY.contact.fields.categoryOptions[cat]}
            </option>
          ))}
        </select>
      </Field>

      {showReferenceUrl && (
        <Field
          id="reference_url"
          label={COPY.contact.fields.referenceUrlLabel}
          error={state.errors?.reference_url}
          help={COPY.contact.fields.referenceUrlHelp}
        >
          <input
            id="reference_url"
            name="reference_url"
            type="url"
            inputMode="url"
            maxLength={500}
            placeholder={COPY.contact.fields.referenceUrlPlaceholder}
            className={baseInputClass(state.errors?.reference_url)}
          />
        </Field>
      )}

      <Field
        id="message"
        label={COPY.contact.fields.messageLabel}
        required
        error={state.errors?.message}
        counter={COPY.contact.fields.counter(messageLength, MAX_MESSAGE_LENGTH)}
      >
        <textarea
          id="message"
          name="message"
          required
          rows={8}
          minLength={1}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setMessageLength(e.target.value.length)}
          placeholder={COPY.contact.fields.messagePlaceholder}
          className={baseInputClass(state.errors?.message, false, 'resize-y leading-7')}
        />
      </Field>

      <label className="flex items-start gap-3 text-sm leading-6 text-ink">
        <input
          type="checkbox"
          name="consent"
          value="1"
          required
          className="mt-1 size-4 rounded border-line text-brand focus:ring-brand"
        />
        <span>
          <Link
            href="/privacy"
            target="_blank"
            className="text-brand underline hover:text-brand-hover"
          >
            プライバシーポリシー
          </Link>
          に同意します
          {state.errors?.consent && (
            <span className="mt-1 block text-xs text-danger">{state.errors.consent}</span>
          )}
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending} className="w-full md:w-auto">
      {pending ? (
        <>
          <Spinner className="size-4" />
          {COPY.contact.submitting}
        </>
      ) : (
        COPY.contact.submit
      )}
    </Button>
  );
}

function Field({
  id,
  label,
  required,
  error,
  help,
  counter,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="ml-2 text-xs font-medium text-brand">
              {COPY.contact.fields.requiredMark}
            </span>
          )}
        </label>
        {counter && <span className="text-xs text-ink-faint">{counter}</span>}
      </div>
      {children}
      {help && !error && <p className="mt-1 text-xs text-ink-muted">{help}</p>}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function baseInputClass(error?: string, locked?: boolean, extra?: string): string {
  return [
    'block w-full rounded-card border bg-white px-3 py-2.5 text-base text-ink outline-none transition',
    'placeholder:text-ink-faint',
    error
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30'
      : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/20',
    locked ? 'bg-surface-2 text-ink-muted cursor-not-allowed' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}
