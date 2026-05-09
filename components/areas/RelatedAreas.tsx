import Link from 'next/link';
import { ArrowRightIcon } from '@/components/layout/icons';
import { COPY } from '@/lib/constants/copy';
import type { Prefecture } from '@/lib/queries/areas';

export function RelatedAreas({ prefectures }: { prefectures: Prefecture[] }) {
  if (prefectures.length === 0) {
    return <p className="text-sm text-ink-muted">{COPY.area.related.empty}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {prefectures.map((p) => (
        <li key={p.id}>
          <Link
            href={`/areas/${p.id}`}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-line-strong"
          >
            {p.name}
            <ArrowRightIcon className="size-3.5 text-ink-faint" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
