/**
 * 認証画面共通レイアウト。
 *
 * 認証画面は searchParams（error / status コード）と Server Action 投入が支配的で、
 * 通常のサイトナビゲーションからの「往復」プリフェッチ用途では呼ばれない
 * （ログイン直リンクや CTA 単発で踏むため）。instant validation の対象から
 * 外す方針として明示する。
 */
export const unstable_instant = false;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
