import { Suspense } from 'react';
import { requireAdmin } from '@/lib/utils/requireAdmin';
import { AdminShell } from './_components/admin-shell';
import AdminLoading from './loading';

/**
 * 管理画面共通レイアウト。middleware の二重防御として `requireAdmin()` を呼び、
 * 非 admin が直接アクセスした場合も `/` にリダイレクトさせる。
 *
 * 認可ロジックを `<AdminGate>` 子コンポーネントに切り出して Suspense の内側に
 * 閉じ込めているのは、layout 直下で cookies + DB アクセスを await すると
 * cacheComponents 有効下で static shell の生成がブロックされるため。AdminShell
 * （ナビ）は静的シェルに乗り、認可と children のデータ取得は Suspense 境界の
 * 下でストリームする。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<AdminLoading />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </AdminShell>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
