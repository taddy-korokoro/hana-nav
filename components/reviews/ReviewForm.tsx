'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { StarIcon } from '@/components/layout/icons';
import { Button } from '@/components/ui/button';
import { FormBanner } from '@/components/ui/form-banner';
import { COPY } from '@/lib/constants/copy';

const COMMENT_MAX = 200;

export type ReviewFormInitial = {
  reviewId: string | null;
  rating: number;
  comment: string;
  visitedAt: string;
};

type Props = {
  spotId: string;
  /** 既存レビューがある場合は初期値を渡す。null の場合は新規投稿モード。 */
  initial: ReviewFormInitial | null;
  /** 編集モードから戻る動線（マイページから来た時に使う想定）。null なら表示しない。 */
  onCancel?: () => void;
  /** 編集モードで論理削除も同居させたいときに true。マイページ側で使う想定。 */
  showDelete?: boolean;
};

/**
 * スポット詳細・マイページ共通のレビュー投稿 / 編集フォーム。
 *
 * - POST /api/reviews へアップサート送信（UNIQUE(user_id, spot_id) 違反は再アクティブ化 + 更新扱い）
 * - DELETE /api/reviews/[id] は `showDelete && initial?.reviewId` のときだけ表示
 * - 200 文字以上 / 星未選択はサーバーに送る前にクライアント側でも弾く
 *
 * 送信後は `router.refresh()` で Server Component 側の集計と一覧を再フェッチする。
 * `revalidatePath` はサーバー側で実行済みなのでブラウザの fetch キャッシュも無効化される。
 */
export function ReviewForm({ spotId, initial, onCancel, showDelete }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [comment, setComment] = useState<string>(initial?.comment ?? '');
  const [visitedAt, setVisitedAt] = useState<string>(initial?.visitedAt ?? '');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<'idle' | 'submitting' | 'deleting'>('idle');
  const [, startTransition] = useTransition();

  const isEdit = initial?.reviewId != null;
  const f = COPY.spotDetail.reviews.form;
  const fieldId = useId();
  const commentId = `${fieldId}-comment`;
  const commentHintId = `${fieldId}-comment-hint`;
  const visitedId = `${fieldId}-visited`;
  const visitedHintId = `${fieldId}-visited-hint`;
  const errorId = `${fieldId}-error`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);

    if (rating < 1 || rating > 5) {
      setErrorKey('invalid_rating');
      return;
    }
    if (comment.length > COMMENT_MAX) {
      setErrorKey('invalid_comment');
      return;
    }

    setBusy('submitting');
    startTransition(async () => {
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spot_id: spotId,
            rating,
            comment: comment.trim() === '' ? null : comment.trim(),
            visited_at: visitedAt === '' ? null : visitedAt,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setErrorKey(data.error ?? 'generic');
          toast.error(
            isEdit
              ? COPY.spotDetail.reviews.toast.updateFailed
              : COPY.spotDetail.reviews.toast.postFailed,
          );
          setBusy('idle');
          return;
        }
        toast.success(
          isEdit ? COPY.spotDetail.reviews.toast.updated : COPY.spotDetail.reviews.toast.posted,
        );
        router.refresh();
        if (onCancel) onCancel();
        setBusy('idle');
      } catch (err) {
        console.error('[ReviewForm] submit failed', err);
        setErrorKey('generic');
        toast.error(
          isEdit
            ? COPY.spotDetail.reviews.toast.updateFailed
            : COPY.spotDetail.reviews.toast.postFailed,
        );
        setBusy('idle');
      }
    });
  }

  function handleDelete() {
    if (!initial?.reviewId) return;
    if (!window.confirm(f.deleteConfirm)) return;

    setErrorKey(null);
    setBusy('deleting');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reviews/${initial.reviewId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setErrorKey(data.error ?? 'generic');
          toast.error(COPY.spotDetail.reviews.toast.deleteFailed);
          setBusy('idle');
          return;
        }
        toast.success(COPY.spotDetail.reviews.toast.deleted);
        router.refresh();
        if (onCancel) onCancel();
        setBusy('idle');
      } catch (err) {
        console.error('[ReviewForm] delete failed', err);
        setErrorKey('generic');
        toast.error(COPY.spotDetail.reviews.toast.deleteFailed);
        setBusy('idle');
      }
    });
  }

  const errorMessage = errorKey ? COPY.spotDetail.reviews.errors[errorKey] : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-card border border-line bg-white p-5"
    >
      <header>
        <p className="font-serif text-lg font-semibold">
          {isEdit ? f.formTitleEdit : f.formTitlePost}
        </p>
      </header>

      <fieldset>
        <legend className="text-sm font-medium text-ink">{f.ratingLabel}</legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={f.ratingStarAria(value)}
              aria-pressed={rating === value}
              className="rounded-full p-1 transition hover:bg-surface-2"
            >
              <StarIcon
                className={`size-7 ${value <= rating ? 'text-brand' : 'text-line-strong'}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-muted">{f.ratingHint}</p>
      </fieldset>

      <div>
        <label htmlFor={commentId} className="block text-sm font-medium text-ink">
          {f.commentLabel}
          <span className="ml-1 text-xs text-ink-faint">（任意）</span>
        </label>
        <textarea
          id={commentId}
          name="comment"
          rows={4}
          maxLength={COMMENT_MAX}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={f.commentPlaceholder}
          aria-describedby={commentHintId}
          className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-line-strong"
        />
        <span id={commentHintId} className="mt-1 block text-right text-xs text-ink-muted">
          {f.commentCounter(comment.length, COMMENT_MAX)}
        </span>
      </div>

      <div>
        <label htmlFor={visitedId} className="block text-sm font-medium text-ink">
          {f.visitedAtLabel}
          <span className="ml-1 text-xs text-ink-faint">（任意）</span>
        </label>
        <input
          id={visitedId}
          type="date"
          name="visited_at"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          aria-describedby={visitedHintId}
          className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-line-strong sm:w-60"
        />
        <span id={visitedHintId} className="mt-1 block text-xs text-ink-muted">
          {f.visitedAtHint}
        </span>
      </div>

      {errorMessage && (
        <FormBanner variant="error" className="text-sm">
          <span id={errorId}>{errorMessage}</span>
        </FormBanner>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          loading={busy === 'submitting'}
          loadingText={f.submitting}
          disabled={busy !== 'idle'}
        >
          {isEdit ? f.submitEdit : f.submitPost}
        </Button>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy !== 'idle'}>
            {f.cancel}
          </Button>
        )}

        {showDelete && initial?.reviewId && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            loading={busy === 'deleting'}
            loadingText={f.deleting}
            disabled={busy !== 'idle'}
            className="ml-auto text-danger hover:bg-danger-soft hover:text-danger"
          >
            {f.deleteAction}
          </Button>
        )}
      </div>
    </form>
  );
}
