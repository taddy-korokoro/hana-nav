import Link from 'next/link';

type Props = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

/**
 * ページネーション。中央のページ番号は ±2 ページ + 端を表示する省略形。
 */
export function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  const window = 2;
  const pagesToShow = new Set<number>([1, totalPages]);
  for (let i = page - window; i <= page + window; i++) {
    if (i >= 1 && i <= totalPages) pagesToShow.add(i);
  }
  const sorted = Array.from(pagesToShow).sort((a, b) => a - b);

  const items: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push('ellipsis');
    items.push(p);
    prev = p;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="ページネーション">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white"
        >
          前へ
        </Link>
      )}

      <ul className="flex items-center gap-1">
        {items.map((it, i) =>
          it === 'ellipsis' ? (
            <li key={`e-${i}`} className="px-2 text-sm text-ink-faint" aria-hidden>
              …
            </li>
          ) : (
            <li key={it}>
              <Link
                href={buildHref(it)}
                aria-current={it === page ? 'page' : undefined}
                className={
                  it === page
                    ? 'grid size-9 place-items-center rounded-pill border border-brand bg-brand-soft text-sm font-semibold text-brand'
                    : 'grid size-9 place-items-center rounded-pill border border-line bg-white text-sm transition hover:border-ink hover:bg-ink hover:text-white'
                }
              >
                {it}
              </Link>
            </li>
          ),
        )}
      </ul>

      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white"
        >
          次へ
        </Link>
      )}
    </nav>
  );
}
