import Link from 'next/link';

type BackLink = {
  href: string;
  label: string;
};

type Props = {
  /** 英字小キャップで先頭に置くカテゴリ表示。例：`"Users"` */
  eyebrow: string;
  /** ページの主タイトル */
  title: React.ReactNode;
  /** タイトル下の説明文。省略可 */
  description?: React.ReactNode;
  /** タイトル上に置く戻るリンク。詳細ページで使う */
  backLink?: BackLink;
  /** タイトル右側に置くアクション（新規作成ボタン等）。md 以上で横並びになる */
  rightSlot?: React.ReactNode;
  /** description の下に追加で挿入する要素（バッジ行・最終更新表示等） */
  meta?: React.ReactNode;
};

/**
 * 管理画面のページタイトル共通コンポーネント。
 *
 * eyebrow（uppercase tracking-[0.25em] text-brand）→ h1（明朝太字）→ description
 * の 3 段構成を全 admin ページで揃える。詳細ページの戻るリンクと、一覧ページで
 * よくある右上のアクションボタン（新規作成等）も同じコンポーネントから差し込める。
 */
export function AdminPageHeader({ eyebrow, title, description, backLink, rightSlot, meta }: Props) {
  return (
    <header className="space-y-3">
      {backLink && (
        <Link href={backLink.href} className="inline-block text-xs text-brand hover:underline">
          ← {backLink.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
      {meta && <div>{meta}</div>}
    </header>
  );
}
