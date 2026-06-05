import { connection } from 'next/server';
import { Suspense } from 'react';
import { isGuestAdmin } from '@/lib/auth/guestAdmin';
import { requireAdmin } from '@/lib/utils/requireAdmin';
import { AdminShell } from './_components/admin-shell';
import { GuestModeBanner } from './_components/GuestModeBanner';
import AdminLoading from './loading';

// 管理画面は per-request の動的データ（cookies + DB）が支配的で static shell に
// 向かないため instant validation の対象から外す。Step 5 ではここで一括 opt-out
// しておき、もし将来サイドナビなど一部分を instant 化したい場合はそのセグメントで
// 個別に上書きする方針。
export const unstable_instant = false;

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
  // 本セグメント以下を build 時 prerender から除外する明示シグナル。
  // 管理画面は service-role 経由（cookies 非依存）で DB を叩くクエリが多く、
  // requireAdmin() の cookies 検証だけでは cacheComponents の prerender 解析に
  // とって不十分。connection() を先に await することで子セグメントの
  // new Date() / DB アクセスが「ランタイム評価」扱いになる。
  await connection();
  const user = await requireAdmin();
  const isGuest = isGuestAdmin(user);

  // ゲストモードでは <fieldset disabled> で children 全体を包み、配下の
  // <button> / <input> / <Switch>（内部 <button>）/ <DialogTrigger> を一括非活性化する。
  // Link でのナビゲーションは制御対象外なので、編集ページに遷移は可能だが、
  // そこの save / 削除ボタンも同じ fieldset 下にあるため書き込みは UI から不可能。
  // サーバー側でも `requireWriteAdmin()` / `requireWriteAdminOrResponse()` で二重防御済み。
  return (
    <>
      {isGuest && <GuestModeBanner />}
      {isGuest ? (
        // <fieldset disabled> ではなく <div data-guest-content> で包む。
        // <fieldset disabled> は入れ子に伝播し HTML 仕様上 override 不可能なため、
        // 読み取り系（検索バー等）の例外指定ができない。代わりに globals.css の
        // `[data-guest-content] ...:not([data-allow-guest])` で CSS のみ無効化する。
        // 書き込みは UI レベルでは技術的にキーボード送信できる余地が残るが、
        // サーバー側の requireWriteAdmin / requireWriteAdminOrResponse が 403 を返すため
        // 書き込みは絶対に通らない（層 1 が本丸、層 2 は UX 補助）。
        <div data-guest-content>{children}</div>
      ) : (
        children
      )}
    </>
  );
}
