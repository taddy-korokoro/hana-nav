import type { Metadata } from 'next';
import Link from 'next/link';
import { BookmarkList } from '@/components/bookmarks/BookmarkList';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';
import { getMyBookmarks } from '@/lib/queries/bookmarks';
import { requireUser } from '@/lib/utils/requireUser';


export const metadata: Metadata = {
  title: COPY.bookmark.list.metaTitle,
};

export default async function MyBookmarksPage() {
  const user = await requireUser();
  const items = await getMyBookmarks(user.id);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header className="mb-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.mypage.top.title, href: '/mypage' },
            { label: COPY.bookmark.list.title },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.bookmark.list.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight md:text-4xl">
          {COPY.bookmark.list.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{COPY.bookmark.list.description}</p>
        {items.length > 0 && (
          <p className="mt-3 text-xs text-ink-faint">
            {items.length}
            {COPY.bookmark.list.countSuffix}
          </p>
        )}
      </header>

      {items.length === 0 ? <EmptyState /> : <BookmarkList items={items} />}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-line bg-white p-10 text-center">
      <p className="font-serif text-lg font-semibold">{COPY.bookmark.list.empty.title}</p>
      <p className="mt-2 text-sm text-ink-muted">{COPY.bookmark.list.empty.description}</p>
      <Link
        href="/spots"
        className="mt-6 inline-flex items-center rounded-pill bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
      >
        {COPY.bookmark.list.empty.cta}
      </Link>
    </div>
  );
}
