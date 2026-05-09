import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';

export function AreaBreadcrumb({
  region,
  prefectureName,
}: {
  region: string;
  prefectureName: string;
}) {
  return (
    <nav aria-label={COPY.area.breadcrumb.aria} className="text-xs text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-ink">
            {COPY.area.breadcrumb.home}
          </Link>
        </li>
        <li aria-hidden className="text-ink-faint">
          /
        </li>
        <li>
          <Link href="/spots" className="hover:text-ink">
            {COPY.area.breadcrumb.areas}
          </Link>
        </li>
        <li aria-hidden className="text-ink-faint">
          /
        </li>
        <li>
          <span className="text-ink-muted">{region}</span>
        </li>
        <li aria-hidden className="text-ink-faint">
          /
        </li>
        <li>
          <span aria-current="page" className="font-medium text-ink">
            {prefectureName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
