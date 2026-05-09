import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FlowerCard } from '@/components/flowers/FlowerCard';
import { FlowerKanaIndex } from '@/components/flowers/FlowerKanaIndex';
import { COPY } from '@/lib/constants/copy';
import { findFlowerIdByAlias, getFlowerList, groupFlowersByKana } from '@/lib/queries/flowers';

// flowers マスターは管理画面からの編集が反映されるべきなので動的レンダリング。
// （MVP では更新頻度は低いが、編集後すぐに反映されないと混乱を招くため）
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.flowersList.metaTitle,
  description: COPY.flowersList.metaDescription,
};

type SearchParams = Promise<{ alias?: string | string[] }>;

export default async function FlowersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const aliasRaw = Array.isArray(sp.alias) ? sp.alias[0] : sp.alias;
  const aliasQuery = aliasRaw?.trim() ?? '';

  // AI 判定や外部リンクから `?alias=ソメイヨシノ` で来た場合は flower_aliases を引いて
  // 該当があれば詳細ページへリダイレクト。無ければ一覧上部に「該当なし」のバナーを出す。
  if (aliasQuery) {
    const id = await findFlowerIdByAlias(aliasQuery);
    if (id) redirect(`/flowers/${id}`);
  }

  const flowers = await getFlowerList();
  const groups = groupFlowersByKana(flowers);
  const aliasMissed = aliasQuery.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
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

      {aliasMissed && (
        <div className="mb-6 rounded-card border border-line bg-white p-5">
          <p className="font-serif text-base font-bold">
            {COPY.flowersList.aliasMiss.title(aliasQuery)}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{COPY.flowersList.aliasMiss.description}</p>
        </div>
      )}

      {flowers.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg font-bold">{COPY.flowersList.empty.title}</p>
          <p className="mt-2 text-sm text-ink-muted">{COPY.flowersList.empty.description}</p>
        </div>
      ) : (
        <>
          <section className="pb-8">
            <FlowerKanaIndex groups={groups} />
          </section>

          <section className="flex items-baseline justify-between border-t border-line pt-6">
            <p className="text-sm text-ink-muted">
              <span className="font-serif text-2xl font-bold text-ink">{flowers.length}</span>
              <span className="ml-2">{COPY.flowersList.countSuffix}</span>
            </p>
          </section>

          {groups.map((group) => (
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
          ))}
        </>
      )}
    </div>
  );
}
