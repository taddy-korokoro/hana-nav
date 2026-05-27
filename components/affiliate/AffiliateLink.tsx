import { ExternalLinkIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';

/**
 * アフィリエイトリンクの基底コンポーネント。
 *
 * 景品表示法ステマ規制（2023 年 10 月施行）への構造的対応として、
 * このコンポーネント経由でしかアフィリエイトリンクを描画できないようにし、
 * `rel="sponsored noopener noreferrer"` と「広告」バッジを必ず付与する。
 *
 * - 直接 `<a href={affiliateUrl}>` を書かないこと。書くとバッジが付かず規制違反になる。
 * - badgeVariant: カード型は overlay（画像左上）、リスト型は inline（テキスト隣）。
 */
type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** バッジの表示位置。カード全体ラップ時は overlay、テキストリンク時は inline */
  badgeVariant?: 'overlay' | 'inline' | 'hidden';
  /** aria-label を上書きしたい場合 */
  ariaLabel?: string;
  /** インライン版で末尾に外部リンクアイコンを付ける */
  showExternalIcon?: boolean;
};

export function AffiliateLink({
  href,
  children,
  className,
  badgeVariant = 'overlay',
  ariaLabel,
  showExternalIcon = false,
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label={ariaLabel}
      className={cn('group relative block focus-visible:outline-none', className)}
    >
      {badgeVariant === 'overlay' && (
        <span
          aria-label={COPY.affiliate.adBadgeAria}
          className="pointer-events-none absolute left-2 top-2 z-10 rounded-pill bg-ink/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white shadow-sm"
        >
          {COPY.affiliate.adBadge}
        </span>
      )}
      {children}
      {(badgeVariant === 'inline' || showExternalIcon) && (
        <span className="ml-1 inline-flex items-center gap-1 align-middle">
          {badgeVariant === 'inline' && (
            <span
              aria-label={COPY.affiliate.adBadgeAria}
              className="rounded-pill bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted"
            >
              {COPY.affiliate.adBadge}
            </span>
          )}
          {showExternalIcon && <ExternalLinkIcon className="size-3.5 text-ink-faint" />}
        </span>
      )}
    </a>
  );
}
