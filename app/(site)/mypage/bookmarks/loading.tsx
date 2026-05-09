export default function MyBookmarksLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <div className="mb-8">
        <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded bg-surface-2 md:h-10" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] w-full animate-pulse rounded-card bg-surface-2" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
