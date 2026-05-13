import { cn } from '@/lib/utils';

type Props = {
  /** カード内の見出し（h2）。省略時はヘッダー領域そのものを描画しない */
  title?: React.ReactNode;
  /** title の右側に置く補助情報（件数バッジ・小さなリンクなど） */
  titleExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * 管理画面のセクションカード共通コンポーネント。
 *
 * `rounded-card border border-line bg-white p-4 md:p-6` の白カードに、任意の
 * 見出し（h2、`font-serif text-lg font-semibold`）と補助情報スロットを内包する。
 * 内部の余白・タイポを揃えることでページ間の見た目を統一する。
 */
export function AdminCard({ title, titleExtra, children, className }: Props) {
  return (
    <section className={cn('rounded-card border border-line bg-white p-4 md:p-6', className)}>
      {title && (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
          {titleExtra}
        </div>
      )}
      {children}
    </section>
  );
}
