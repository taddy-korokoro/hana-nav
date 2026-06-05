import { AffiliateLink } from '@/components/affiliate/AffiliateLink';
import { COPY } from '@/lib/constants/copy';

/**
 * 3 つのセクション（books / products / hotels）で共通の枠組みを提供する。
 *
 * - セクション見出し（eyebrow + title + description）
 * - 「広告」文言を含むフッターと、結果が無い時のフォールバックリンク
 *
 * セクション全体に「広告を含むセクションである」ことを明示するため、
 * 子コンテンツが空の場合（API 障害含む）でも空状態文言＋楽天検索リンクを表示する。
 */
export function AffiliateSectionLayout({
  eyebrow,
  title,
  description,
  fallbackUrl,
  fallbackLabel,
  empty,
  isEmpty,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  fallbackUrl: string;
  fallbackLabel?: string;
  empty: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-ink-muted">{description}</p>
        </div>
      </div>

      <div className="mt-6">
        {isEmpty ? (
          <div className="rounded-card border border-dashed border-line bg-white p-6 text-sm text-ink-muted">
            <p>{empty}</p>
            <p className="mt-3">
              <AffiliateLink href={fallbackUrl} badgeVariant="inline" showExternalIcon>
                <span className="text-brand underline-offset-4 group-hover:underline">
                  {fallbackLabel ?? COPY.affiliate.fallbackToRakutenLabel}
                </span>
              </AffiliateLink>
            </p>
          </div>
        ) : (
          children
        )}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-ink-faint">{COPY.affiliate.disclaimer}</p>
    </section>
  );
}
