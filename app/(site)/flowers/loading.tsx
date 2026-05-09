export default function FlowersLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-2/3 animate-pulse rounded bg-surface-2 md:h-12" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-surface-2" />
      </section>

      <div className="flex gap-2 pb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-16 animate-pulse rounded-pill bg-surface-2" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] animate-pulse rounded-card bg-surface-2" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
