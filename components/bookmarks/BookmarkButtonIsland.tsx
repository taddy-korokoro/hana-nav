'use client';

import { useEffect, useState } from 'react';
import { BookmarkButton } from './BookmarkButton';

type Props = {
  spotId: string;
  spotName: string;
};

type InteractionState =
  | {
      isAuthenticated: boolean;
      bookmarked: boolean;
    }
  | undefined;

/**
 * スポット詳細ページの BookmarkButton をユーザー依存状態の取得込みでラップする Client Island。
 *
 * 親（spots/[id]/page.tsx の Server Component）は `'use cache'` で公開キャッシュに乗せたいので、
 * `auth.getUser()` / `isBookmarked` のような Cookie 依存処理をサーバー側で行えない。
 * 代わりにこの Island が `/api/bookmarks/[spot_id]` を fetch して、ログイン状態 + ブックマーク状態を
 * クライアントサイドで解決する（UserNavIsland と同じ設計）。
 */
export function BookmarkButtonIsland({ spotId, spotName }: Props) {
  const [state, setState] = useState<InteractionState>(undefined);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/bookmarks/${spotId}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { isAuthenticated: boolean; bookmarked: boolean } | null) => {
        if (!mounted) return;
        if (!data) {
          // res.ok=false（500 等）の場合は未ログイン扱いにフォールバックして
          // スケルトンが永久残留しないようにする。
          setState({ isAuthenticated: false, bookmarked: false });
          return;
        }
        setState({
          isAuthenticated: data.isAuthenticated,
          bookmarked: data.bookmarked,
        });
      })
      .catch(() => {
        if (mounted) setState({ isAuthenticated: false, bookmarked: false });
      });
    return () => {
      mounted = false;
    };
  }, [spotId]);

  if (state === undefined) {
    // BookmarkButton と同じ高さ・形状のスケルトン（h-10 / rounded-pill）
    return <div className="h-10 w-36 animate-pulse rounded-pill bg-surface-2" aria-hidden />;
  }

  return (
    <BookmarkButton
      spotId={spotId}
      spotName={spotName}
      isAuthenticated={state.isAuthenticated}
      initialBookmarked={state.bookmarked}
      redirectAfterLogin={`/spots/${spotId}`}
    />
  );
}
