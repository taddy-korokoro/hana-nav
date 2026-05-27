import { Suspense } from 'react';
import { requireAdmin } from '@/lib/utils/requireAdmin';
import { AdminShell } from './_components/admin-shell';
import AdminLoading from './loading';

/**
 * 管理画面共通レイアウト。middleware の二重防御として `requireAdmin()` を呼び、
 * 非 admin が直接アクセスした場合も `/` にリダイレクトさせる。
 *
 * チケット 22 Step 1: cacheComponents 有効化後、layout 直下で await すると
 * static shell の生成がブロックされる（cookies + DB アクセスのため）。
 * 認可ロジックを `<AdminGate>` という子コンポーネントに切り出して Suspense の
 * 内側に閉じ込めることで、AdminShell（ナビ）は static shell に乗り、認可と
 * children のデータ取得は Suspense 境界の下でストリームする構造にする。
 *
 * cacheComponents off の現状では single-render なので挙動差はないが、Step 4 で
 * cacheComponents を on にするまでの間も regression なく走り続ける。
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
