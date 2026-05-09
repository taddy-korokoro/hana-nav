'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { BookmarkIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';

type Props = {
  spotId: string;
  spotName: string;
  /** 未ログイン時は null を渡す。ボタン表示の代わりにログイン誘導リンクを描画する。 */
  isAuthenticated: boolean;
  /** サーバー側で取得済みの初期状態。クライアントは楽観的にここから差分更新する。 */
  initialBookmarked: boolean;
  /** ログイン誘導後に詳細ページへ戻すため、`/spots/[id]` を渡す。 */
  redirectAfterLogin: string;
};

export function BookmarkButton({
  spotId,
  spotName,
  isAuthenticated,
  initialBookmarked,
  redirectAfterLogin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // useTransition の `isPending` は revalidate 由来のサーバー再フェッチ完了まで true。
  // 楽観 UI のためフェッチ前に optimistic state を切り替える。
  const [optimistic, setOptimistic] = useState<boolean>(initialBookmarked);

  if (!isAuthenticated) {
    const loginHref = `/auth/login?next=${encodeURIComponent(redirectAfterLogin)}`;
    return (
      <Link
        href={loginHref}
        className="inline-flex items-center gap-2 rounded-pill border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
      >
        <BookmarkIcon className="size-4" />
        {COPY.bookmark.button.loginPrompt}
      </Link>
    );
  }

  const next = !optimistic;

  const handleClick = () => {
    if (isPending) return;
    setOptimistic(next);
    startTransition(async () => {
      try {
        const res = await (next
          ? fetch('/api/bookmarks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ spot_id: spotId }),
            })
          : fetch(`/api/bookmarks/${spotId}`, { method: 'DELETE' }));

        if (!res.ok) throw new Error(`status ${res.status}`);
        toast.success(next ? COPY.bookmark.toast.added : COPY.bookmark.toast.removed);
        router.refresh();
      } catch (error) {
        console.error('[BookmarkButton] failed', error);
        // ロールバック
        setOptimistic(!next);
        toast.error(next ? COPY.bookmark.toast.addFailed : COPY.bookmark.toast.removeFailed);
      }
    });
  };

  const baseClass =
    'inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition disabled:opacity-60';
  const activeClass = optimistic
    ? 'bg-brand text-white hover:bg-brand-hover'
    : 'border border-line bg-white text-ink hover:bg-surface-2';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic}
      aria-label={
        optimistic
          ? COPY.bookmark.button.ariaRemove(spotName)
          : COPY.bookmark.button.ariaAdd(spotName)
      }
      className={`${baseClass} ${activeClass}`}
    >
      <BookmarkIcon
        className="size-4"
        // 保存済みは塗りつぶし表示にして状態が一目で分かるようにする
        style={optimistic ? { fill: 'currentColor' } : undefined}
      />
      {isPending
        ? optimistic
          ? COPY.bookmark.button.adding
          : COPY.bookmark.button.removing
        : optimistic
          ? COPY.bookmark.button.remove
          : COPY.bookmark.button.add}
    </button>
  );
}
