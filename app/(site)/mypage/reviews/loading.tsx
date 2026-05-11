export default function MyReviewsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-8 md:pt-12">
      <div className="mb-8">
        <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded bg-surface-2 md:h-10" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-card border border-line bg-white p-4 sm:flex-row sm:p-5"
          >
            <div className="aspect-[4/3] w-full shrink-0 animate-pulse rounded-card bg-surface-2 sm:w-48" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
