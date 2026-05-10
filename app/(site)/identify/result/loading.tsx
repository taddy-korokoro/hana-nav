export default function IdentifyResultLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-9 w-1/3 animate-pulse rounded bg-surface-2 md:h-10" />
      </section>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="aspect-[4/3] w-full animate-pulse rounded-card-lg bg-surface-2" />
        <div className="space-y-4">
          <div className="h-7 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-24 w-full animate-pulse rounded-card bg-surface-2" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 w-full animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
