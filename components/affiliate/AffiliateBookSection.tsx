import { AffiliateBookCard } from '@/components/affiliate/AffiliateBookCard';
import { AffiliateSectionLayout } from '@/components/affiliate/AffiliateSectionLayout';
import { COPY } from '@/lib/constants/copy';
import { searchBooksByFlowerName } from '@/lib/queries/rakuten';

/**
 * AI 判定結果ページに挿入する書籍カード群。
 *
 * - 花名は flower_master.name 優先、なければ AI 推定名（ai_result.flower_name / flower_variety）。
 * - Server Component として呼ばれる前提（fetch のキャッシュを効かせるため）。
 * - 1 セクションあたり最大 4 件。0 件時は楽天検索へのフォールバックリンクを出す。
 */
export async function AffiliateBookSection({ flowerName }: { flowerName: string }) {
  const trimmed = flowerName.trim();
  const books = trimmed ? await searchBooksByFlowerName(trimmed) : [];

  return (
    <AffiliateSectionLayout
      eyebrow={COPY.affiliate.books.eyebrow}
      title={COPY.affiliate.books.title}
      description={COPY.affiliate.books.description}
      fallbackUrl={COPY.affiliate.books.fallbackUrl(trimmed || '花')}
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
