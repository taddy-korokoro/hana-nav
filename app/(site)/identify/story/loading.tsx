export default function IdentifyStoryLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <section className="pb-6 pt-12 md:pt-16">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-9 w-1/3 animate-pulse rounded bg-surface-2 md:h-10" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="h-96 animate-pulse rounded-card-lg bg-surface-2" />
        <div className="mx-auto aspect-[9/16] w-full max-w-sm animate-pulse rounded-card-lg bg-surface-2" />
      </div>
    </div>
  );
}
