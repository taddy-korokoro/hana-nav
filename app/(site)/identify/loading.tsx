export default function IdentifyLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-surface-2 md:h-12" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
      </section>

      <div className="space-y-6">
        <div className="h-20 w-full animate-pulse rounded-card bg-surface-2" />
        <div className="rounded-card-lg border border-line bg-white p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-32 w-full animate-pulse rounded-card bg-surface-2" />
            <div className="h-32 w-full animate-pulse rounded-card bg-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
