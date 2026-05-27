import Image from 'next/image';
import { AffiliateLink } from '@/components/affiliate/AffiliateLink';
import { COPY } from '@/lib/constants/copy';
import type { AffiliateBook } from '@/lib/queries/rakuten';

export function AffiliateBookCard({ book }: { book: AffiliateBook }) {
  return (
    <AffiliateLink
      href={book.affiliateUrl}
      ariaLabel={book.title}
      className="rounded-card border border-line bg-white p-3 transition hover:border-line-strong"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-surface-2">
        {book.imageUrl ? (
          <Image
            src={book.imageUrl}
            alt={book.title}
            fill
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
            className="object-contain transition group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div
            className="size-full bg-gradient-to-br from-rose-200 via-pink-200 to-amber-100"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-ink">
          {book.title}
        </p>
        {book.author && (
          <p className="line-clamp-1 text-xs text-ink-muted">
            {COPY.affiliate.books.authorLabel(book.author)}
          </p>
        )}
        {book.price > 0 && (
          <p className="text-sm font-bold text-brand">
            {COPY.affiliate.books.priceLabel(book.price)}
          </p>
        )}
      </div>
    </AffiliateLink>
  );
}
