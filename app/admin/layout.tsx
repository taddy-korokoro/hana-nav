import { requireAdmin } from '@/lib/utils/requireAdmin';
import { AdminShell } from './_components/admin-shell';

/**
 * 管理画面共通レイアウト。middleware の二重防御として `requireAdmin()` を呼び、
 * 非 admin が直接アクセスした場合も `/` にリダイレクトさせる。
 *
 * レイアウト本体は `<AdminShell>`（Client）に委譲する。「サイトに戻る」と
 * 「ログアウト」はナビ（Sheet / サイドバー）に組み込み済みなのでここでは渡さない。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
