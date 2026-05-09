export default function AreaDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <div className="pb-6 pt-12 md:pt-16">
        <div className="h-3 w-48 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-1/2 animate-pulse rounded bg-surface-2 md:h-14" />
        <div className="mt-3 h-4 w-32 animate-pulse rounded bg-surface-2" />
      </div>

      <div className="mt-10">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="mt-1 h-7 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/3] animate-pulse rounded-card bg-surface-2" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
              <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-1 h-7 w-56 animate-pulse rounded bg-surface-2" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
