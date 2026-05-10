export default function MypageTopLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <div className="pb-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-48 animate-pulse rounded bg-surface-2 md:h-12" />
        <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mt-8 flex flex-col gap-6 rounded-card-lg bg-white p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <div className="size-16 animate-pulse rounded-full bg-surface-2 sm:size-20" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-40 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-56 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-card border border-line bg-white" />
        ))}
      </div>
    </div>
  );
}
