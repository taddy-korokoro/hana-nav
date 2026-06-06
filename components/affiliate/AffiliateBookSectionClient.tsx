'use client';

import { Component, type ReactNode, Suspense, use, useMemo } from 'react';
import { AffiliateBookCard } from '@/components/affiliate/AffiliateBookCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { AffiliateSectionSkeleton } from '@/components/affiliate/AffiliateSectionSkeleton';
import { getAffiliateBooksAction } from '@/components/affiliate/actions';
import { COPY } from '@/lib/constants/copy';
import type { AffiliateBook } from '@/lib/queries/rakuten';

// Server Action が 10 秒以内に settle しない場合は強制的に reject させて
// skeleton 固定の事故を防ぐ。本番で actual fetch 起点ならまず起きないが、
// Netlify Functions 経由の Server Action は環境要因（コールドスタート / Edge
// レイヤの中断）で稀に Promise が宙吊りになる事例が観測される。
const ACTION_TIMEOUT_MS = 10_000;

/**
 * AI 判定結果ページ専用の Client ラッパ。
 *
 * 花名が sessionStorage（クライアント側）にしか無いため Server Component には組み込めない。
 * Server Action 経由で書籍リストを取得し、Suspense + use(promise) で待機する。
 *
 * Server Action の戻り値は Next.js のリクエストキャッシュにも乗らないが、内部の
 * `searchBooksByFlowerName` は React.cache + fetch revalidate でキャッシュされる。
 */
export function AffiliateBookSectionClient({ flowerName }: { flowerName: string }) {
  const trimmed = flowerName.trim();
  if (!trimmed) return null;

  return (
    <BookSectionErrorBoundary flowerName={trimmed}>
      <Suspense fallback={<BookSectionSkeleton />}>
        <BookSectionContent flowerName={trimmed} />
      </Suspense>
    </BookSectionErrorBoundary>
  );
}

function BookSectionContent({ flowerName }: { flowerName: string }) {
  // useMemo で promise を flowerName に紐付けて安定化。
  // 同じ flowerName の再レンダリングで同じ promise を返すことで use() が無限ループを起こさない。
  const promise = useMemo(() => raceWithTimeout(getAffiliateBooksAction(flowerName)), [flowerName]);
  const books = use<AffiliateBook[]>(promise);

  return (
    <AffiliateSectionLayout
      eyebrow={COPY.affiliate.books.eyebrow}
      title={COPY.affiliate.books.title}
      description={COPY.affiliate.books.description}
      fallbackUrl={COPY.affiliate.books.fallbackUrl(flowerName)}
      empty={COPY.affiliate.books.empty}
      isEmpty={books.length === 0}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <AffiliateBookCard key={book.id} book={book} />
        ))}
      </div>
    </AffiliateSectionLayout>
  );
}

function BookSectionSkeleton() {
  return (
    <AffiliateSectionSkeleton
      eyebrow={COPY.affiliate.books.eyebrow}
      title={COPY.affiliate.books.title}
      description={COPY.affiliate.books.description}
      fallbackUrl={COPY.affiliate.books.fallbackUrl('花')}
      empty={COPY.affiliate.books.empty}
      variant="book"
    />
  );
}

/**
 * Server Action の失敗・タイムアウト時に skeleton 固定を避けるための ErrorBoundary。
 * 落ちたら empty fallback（楽天検索リンク）に倒す。Suspense では rejection は
 * 拾えないため Class Component で書く必要がある。
 */
class BookSectionErrorBoundary extends Component<
  { flowerName: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[rakuten] AffiliateBookSection client failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AffiliateSectionLayout
          eyebrow={COPY.affiliate.books.eyebrow}
          title={COPY.affiliate.books.title}
          description={COPY.affiliate.books.description}
          fallbackUrl={COPY.affiliate.books.fallbackUrl(this.props.flowerName)}
          empty={COPY.affiliate.books.empty}
          isEmpty
        >
          <></>
        </AffiliateSectionLayout>
      );
    }
    return this.props.children;
  }
}

function raceWithTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Server Action timeout')), ACTION_TIMEOUT_MS),
    ),
  ]);
}
