import { Suspense } from 'react';
import { requireUser } from '@/lib/utils/requireUser';
import MypageTopLoading from './loading';

// マイページは認証必須・per-user データが中心で static shell に向かないため
// instant validation の対象外。
export const unstable_instant = false;

/**
 * マイページ共通レイアウト。
 *
 * 認証ゲートを `<MypageGate>` 子コンポーネントに切り出して Suspense の内側に
 * 閉じ込めているのは、layout 直下で `requireUser()`（cookies アクセス）を await
 * すると cacheComponents 有効下で static shell の生成がブロックされるため。
 * layout 自体は静的シェルで、認証チェックと children のデータ取得は Suspense
 * 境界の下でストリームする。
 *
 * 各 page も独立して `requireUser()` を呼んでいるが、`requireUser` は
 * `getCurrentUser`（React.cache 済み）経由なので同一リクエスト内で Auth 往復は
 * 1 回にまとまる。layout 側の Gate は「ログインしていないとそもそも下に
 * 行かない」ことを構造的に保証する。
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
