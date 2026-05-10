export default function MyProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-8 md:pt-12">
      <div className="pb-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded bg-surface-2 md:h-10" />
        <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-surface-2" />
        <div className="mt-4 h-3 w-32 animate-pulse rounded bg-surface-2" />
      </div>

      <div className="mt-8 rounded-card-lg bg-white p-6 sm:p-8">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 flex items-center gap-5">
          <div className="size-20 animate-pulse rounded-full bg-surface-2" />
          <div className="space-y-2">
            <div className="h-7 w-28 animate-pulse rounded-pill bg-surface-2" />
            <div className="h-7 w-28 animate-pulse rounded-pill bg-surface-2" />
          </div>
        </div>
        <div className="mt-3 h-3 w-full max-w-md animate-pulse rounded bg-surface-2" />
      </div>

      <div className="mt-6 rounded-card-lg bg-white p-6 sm:p-8">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-2 h-10 w-full animate-pulse rounded-card bg-surface-2" />
        <div className="mt-2 h-3 w-full max-w-md animate-pulse rounded bg-surface-2" />
        <div className="mt-5 h-9 w-28 animate-pulse rounded-pill bg-surface-2" />
      </div>
    </div>
  );
}
