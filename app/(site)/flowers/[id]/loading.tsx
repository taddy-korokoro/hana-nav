export default function FlowerDetailLoading() {
  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:pt-12">
      {/* ヘッダー: eyebrow / 花名 / 読み仮名 / 見頃バッジ */}
      <div className="mb-8">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-1/2 animate-pulse rounded bg-surface-2 md:h-14" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 h-7 w-32 animate-pulse rounded-pill bg-surface-2" />
      </div>

      {/* ヒーロー画像（16:9） */}
      <div className="aspect-[16/9] w-full animate-pulse rounded-card-lg bg-surface-2" />

      {/* セクション: 花の特徴 */}
      <div className="mt-10">
        <div className="h-7 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface-2" />
      </div>

      {/* セクション: 見頃カレンダー（12 か月帯） */}
      <div className="mt-10">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="mt-1 h-7 w-40 animate-pulse rounded bg-surface-2" />
        <ul className="mt-4 grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <li key={i} className="flex flex-col items-center gap-1">
              <span className="block h-8 w-full animate-pulse rounded-card bg-surface-2" />
              <span className="block h-2 w-3 animate-pulse rounded bg-surface-2" />
            </li>
          ))}
        </ul>
      </div>

      {/* セクション: 別名・品種（チップ列） */}
      <div className="mt-10">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="mt-1 h-7 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-pill bg-surface-2" />
          ))}
        </div>
      </div>

      {/* セクション: この花が見られるスポット（3 枚グリッド） */}
      <div className="mt-12">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="mt-1 h-7 w-56 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/3] animate-pulse rounded-card bg-surface-2" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
              <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
