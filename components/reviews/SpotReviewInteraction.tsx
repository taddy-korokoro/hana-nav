'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COPY } from '@/lib/constants/copy';
import { ReviewForm, type ReviewFormInitial } from './ReviewForm';

type Props = {
  spotId: string;
  isAuthenticated: boolean;
  /** 自分の既存レビュー。未投稿は null。 */
  myReview: ReviewFormInitial | null;
  /** マイページ等から「?edit=review」で遷移してきた場合に true。初期表示でフォームを展開する。 */
  defaultOpen?: boolean;
};

/**
 * スポット詳細のレビューセクション上部に置く「投稿 / 編集 / ログイン誘導」スイッチャー。
 *
 * 未ログイン: ログイン誘導カード（next にスポット詳細を埋め込む）
 * ログイン済 / 未投稿: 「レビューを書く」ボタン → クリックで投稿フォーム展開
 * ログイン済 / 投稿済: 「あなたのレビュー」サマリー + 「編集する」ボタン → クリックで編集フォーム展開
 *
 * 既存レビューの本文は下の SpotReviewSection の一覧側にも出るが、所有者が自分であることが
 * 一目で分かるようバッジ + 編集導線をここで提供する。論理削除は編集モードのフォームから行う。
 */
export function SpotReviewInteraction({
  spotId,
  isAuthenticated,
  myReview,
  defaultOpen = false,
}: Props) {
  const [showForm, setShowForm] = useState(defaultOpen);

  // ?edit=review でフラグメント遷移してきた場合、Next.js のクライアント遷移ではブラウザの
  // 自動フラグメントスクロールが効かないことがある。セクション見出し（Reviews）から
  // 始まる位置まで移動させたいので、フォーム本体ではなく親 `<section id="reviews">` を起点に
  // スクロールする（section 側に `scroll-mt-24` を持たせてヘッダー分のオフセットを確保）。
  useEffect(() => {
    if (!defaultOpen) return;
    const section = document.getElementById('reviews');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [defaultOpen]);

  if (!isAuthenticated) {
    const loginHref = `/auth/login?next=${encodeURIComponent(`/spots/${spotId}`)}`;
    return (
      <div className="rounded-card border border-line bg-white p-5">
        <p className="font-serif text-lg font-semibold">
          {COPY.spotDetail.reviews.loginPromptTitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {COPY.spotDetail.reviews.loginPromptDescription}
        </p>
        <Link
          href={loginHref}
          className="mt-4 inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          {COPY.spotDetail.reviews.loginCta}
        </Link>
      </div>
    );
  }

  if (showForm) {
    return (
      <ReviewForm
        spotId={spotId}
        initial={myReview}
        onCancel={() => setShowForm(false)}
        showDelete={!!myReview?.reviewId}
      />
    );
  }

  if (myReview) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface-2 px-5 py-4">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{COPY.spotDetail.reviews.yourReviewBadge}</span>
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-pill border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-line-strong"
        >
          {COPY.spotDetail.reviews.editAction}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-white px-5 py-4">
      <p className="text-sm text-ink-muted">{COPY.spotDetail.reviews.promptFirst}</p>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {COPY.spotDetail.reviews.form.formTitlePost}
      </button>
    </div>
  );
}
