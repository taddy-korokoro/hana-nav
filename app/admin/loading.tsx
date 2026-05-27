/**
 * 管理画面全体の Suspense fallback。
 *
 * チケット 22 Step 1: cacheComponents 有効化後、layout/page の uncached データ取得
 * （requireAdmin / DB クエリ）は Suspense 境界の内側にしか置けなくなる。loading.tsx
 * を置くことでルートセグメントに暗黙の Suspense 境界ができ、admin 配下の page 単位の
 * データ取得もここに吸収される。
 *
 * cacheComponents off の現状ではナビゲーション中のフォールバックとして機能する。
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
