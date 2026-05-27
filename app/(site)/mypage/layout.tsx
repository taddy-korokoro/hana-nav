import { Suspense } from 'react';
import { requireUser } from '@/lib/utils/requireUser';
import MypageTopLoading from './loading';

/**
 * マイページ共通レイアウト。
 *
 * チケット 22 Step 1: cacheComponents 有効化後、layout 直下で `requireUser()`
 * を await すると static shell の生成がブロックされる（cookies アクセスのため）。
 * 認証ゲートを `<MypageGate>` という子コンポーネントに切り出して Suspense の
 * 内側に閉じ込めることで、layout 自体は static として動き、認証チェックと
 * children のデータ取得は Suspense 境界の下でストリームする構造にする。
 *
 * 各 page も独立して `requireUser()` を呼んでいるが、これは（将来 React.cache
 * 化する余地のある）冪等な呼び出しなので問題なし。レイアウト側の Gate は
 * 「ログインしていないとそもそも下に行かない」ことを構造的に保証する。
 *
 * cacheComponents off の現状では single-render なので挙動差はないが、Step 4 で
 * cacheComponents を on にするまでの間も regression なく走り続ける。
 */
export default function MypageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MypageTopLoading />}>
      <MypageGate>{children}</MypageGate>
    </Suspense>
  );
}

async function MypageGate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
