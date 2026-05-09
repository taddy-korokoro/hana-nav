import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import type { FlowerKanaGroup } from '@/lib/queries/flowers';

/**
 * 50 音ジャンプリンク。各セクションの id（`kana-{label}`）にハッシュ遷移する。
 * 件数 0 のグループは呼び出し側で除外済みなので、表示するラベルは押せる前提。
 */
export function FlowerKanaIndex({ groups }: { groups: FlowerKanaGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <nav
      aria-label={COPY.flowersList.indexAria}
      className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
    >
      {groups.map((g) => (
        <Link
          key={g.label}
          href={`#kana-${g.label}`}
          className="shrink-0 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white"
        >
          <span className="font-serif text-base font-semibold">{g.label}</span>
          <span className="ml-2 text-xs text-ink-faint">{g.flowers.length}</span>
        </Link>
      ))}
    </nav>
  );
}
