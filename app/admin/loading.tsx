/**
 * 管理画面全体の Suspense fallback。loading.tsx を置くことでルートセグメントに
 * 暗黙の Suspense 境界ができ、各 page のデータ取得（admin 認可 + DB クエリ）が
 * ここに吸収される。cacheComponents 有効下では必須、off の現状でも遷移時の
 * スケルトンとして機能する。
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
      <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-9 w-64 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
      <div className="mt-8 grid grid-cols-1 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
