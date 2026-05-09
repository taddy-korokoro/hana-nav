export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="pb-10 pt-12 md:pb-16 md:pt-20">
        <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 h-12 w-full max-w-md animate-pulse rounded bg-surface-2 md:h-16" />
        <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
        <div className="mt-2 h-4 w-2/3 max-w-xl animate-pulse rounded bg-surface-2" />
        <div className="mt-8 h-16 w-full animate-pulse rounded-card bg-surface-2" />
      </section>
      <section className="pt-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/3] w-full animate-pulse rounded-card bg-surface-2" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
