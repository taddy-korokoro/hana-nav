export default function SpotDetailLoading() {
  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:pt-12">
      <div className="mb-8">
        <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-surface-2 md:h-14" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="aspect-[16/9] w-full animate-pulse rounded-card-lg bg-surface-2" />
      <div className="mt-6 h-4 w-full animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
      <div className="mt-10 h-[300px] w-full animate-pulse rounded-card-lg bg-surface-2 md:h-[360px]" />
    </article>
  );
}
