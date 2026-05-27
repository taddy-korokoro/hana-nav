import { Search, X } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { FlowerCard } from '@/components/flowers/FlowerCard';
import { FlowerKanaIndex } from '@/components/flowers/FlowerKanaIndex';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';
import {
  type FlowerListItem,
  findFlowerIdByAlias,
  getFlowerList,
  groupFlowersByKana,
} from '@/lib/queries/flowers';

// TODO: searchParams（alias / q）が必須のため `prefetch: 'static'` には乗らない。
// `prefetch: 'runtime'` + samples 化を検討する余地あり。

export const metadata: Metadata = {
  title: COPY.flowersList.metaTitle,
  description: COPY.flowersList.metaDescription,
};

type FlowersSearchParams = Promise<{ alias?: string | string[]; q?: string | string[] }>;

/** 名前またはふりがなに query（部分一致・大文字小文字非区別）を含む花だけを返す */
function filterFlowersByKeyword(flowers: FlowerListItem[], query: string): FlowerListItem[] {
  const q = query.toLowerCase();
  return flowers.filter((f) => {
    if (f.name.toLowerCase().includes(q)) return true;
    if (f.nameKana && f.nameKana.toLowerCase().includes(q)) return true;
    return false;
  });
}

/**
 * 花の種類一覧ページ。
 *
 * チケット 22 Step 2: searchParams / getFlowerList / findFlowerIdByAlias を
 * Suspense 境界内側に押し下げ、page 本体は sync で静的ヘッダーだけを描く。
 */
export default function FlowersPage({ searchParams }: { searchParams: FlowersSearchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <Breadcrumb
          className="mb-4"
          items={[{ label: COPY.nav.labels.home, href: '/' }, { label: COPY.nav.labels.flowers }]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.flowersList.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {COPY.flowersList.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
          {COPY.flowersList.description}
        </p>
      </section>

      <Suspense fallback={<FlowersContentSkeleton />}>
        <FlowersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FlowersContent({ searchParams }: { searchParams: FlowersSearchParams }) {
  const sp = await searchParams;
  const aliasRaw = Array.isArray(sp.alias) ? sp.alias[0] : sp.alias;
  const aliasQuery = aliasRaw?.trim() ?? '';
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const keyword = qRaw?.trim() ?? '';

  // AI 判定や外部リンクから `?alias=ソメイヨシノ` で来た場合は flower_aliases を引いて
  // 該当があれば詳細ページへリダイレクト。無ければ一覧上部に「該当なし」のバナーを出す。
  if (aliasQuery) {
    const id = await findFlowerIdByAlias(aliasQuery);
    if (id) redirect(`/flowers/${id}`);
  }

  const flowers = await getFlowerList();
  const aliasMissed = aliasQuery.length > 0;
  const isSearching = keyword.length > 0;
  const filtered = isSearching ? filterFlowersByKeyword(flowers, keyword) : flowers;
  const groups = groupFlowersByKana(filtered);

  return (
    <>
      {aliasMissed && (
        <div className="mb-6 rounded-card border border-line bg-white p-5">
          <p className="font-serif text-base font-bold">
            {COPY.flowersList.aliasMiss.title(aliasQuery)}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{COPY.flowersList.aliasMiss.description}</p>
        </div>
      )}

      {/* 花専用の検索フォーム（花名・ふりがなに対する部分一致） */}
      <form
        action="/flowers"
        method="get"
        role="search"
        className="mb-4 flex items-center gap-2 rounded-card-lg border border-line bg-white p-2 shadow-sm transition-colors focus-within:border-line-strong"
      >
        <Search className="ml-3 size-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={keyword}
          placeholder={COPY.flowersList.search.placeholder}
          className="w-full bg-transparent py-3 text-base outline-none placeholder:text-ink-faint"
        />
        <Button type="submit" size="md" className="shrink-0">
          <Search className="size-4" aria-hidden />
          {COPY.flowersList.search.submit}
        </Button>
      </form>

      {isSearching && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-muted">
            {COPY.flowersList.search.resultHeading(keyword, filtered.length)}
          </span>
          <Link
            href="/flowers"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
            {COPY.flowersList.search.clear}
          </Link>
        </div>
      )}

      {flowers.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold">{COPY.flowersList.empty.title}</p>
          <p className="mt-2 text-sm text-ink-muted">{COPY.flowersList.empty.description}</p>
        </div>
      ) : isSearching && filtered.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold">
            {COPY.flowersList.search.noResult(keyword)}
          </p>
        </div>
      ) : (
        <>
          {!isSearching && (
            <section className="pb-8">
              <FlowerKanaIndex groups={groups} />
            </section>
          )}

          <section className="flex items-baseline justify-between border-t border-line pt-6">
            <p className="text-sm text-ink-muted">
              <span className="font-serif text-2xl font-bold text-ink">{filtered.length}</span>
              <span className="ml-2">
                {isSearching ? COPY.flowersList.search.countSuffix : COPY.flowersList.countSuffix}
              </span>
            </p>
          </section>

          {isSearching ? (
            <section aria-label={COPY.flowersList.search.resultHeading(keyword, filtered.length)}>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((flower, i) => (
                  <FlowerCard key={flower.id} flower={flower} index={i} />
                ))}
              </div>
            </section>
          ) : (
            groups.map((group) => (
              <section
                key={group.label}
                id={`kana-${group.label}`}
                aria-label={COPY.flowersList.sectionAria(group.label)}
                // anchor ジャンプ時にヘッダーで隠れないようスクロール余白を持たせる
                className="scroll-mt-24 pt-12"
              >
                <div className="flex items-baseline gap-3">
                  <h2 className="font-serif text-2xl font-bold tracking-tight">{group.label}</h2>
                  <span className="text-xs text-ink-faint">
                    {group.flowers.length}
                    {COPY.flowersList.countSuffix}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {group.flowers.map((flower, i) => (
                    <FlowerCard key={flower.id} flower={flower} index={i} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </>
  );
}

function FlowersContentSkeleton() {
  return (
    <>
      <div className="mb-4 h-14 animate-pulse rounded-card-lg bg-surface-2" />
      <div className="border-t border-line pt-6">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </>
  );
}
