'use client';

import { Suspense, use, useMemo } from 'react';
import { AffiliateBookCard } from '@/components/affiliate/AffiliateBookCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { AffiliateSectionSkeleton } from '@/components/affiliate/AffiliateSectionSkeleton';
import { getAffiliateBooksAction } from '@/components/affiliate/actions';
import { COPY } from '@/lib/constants/copy';
import type { AffiliateBook } from '@/lib/queries/rakuten';

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
    <Suspense fallback={<BookSectionSkeleton />}>
      <BookSectionContent flowerName={trimmed} />
    </Suspense>
  );
}

function BookSectionContent({ flowerName }: { flowerName: string }) {
  // useMemo で promise を flowerName に紐付けて安定化。
  // 同じ flowerName の再レンダリングで同じ promise を返すことで use() が無限ループを起こさない。
  const promise = useMemo(() => getAffiliateBooksAction(flowerName), [flowerName]);
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
