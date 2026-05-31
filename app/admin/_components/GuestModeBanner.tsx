/**
 * 採用者確認用ゲストモードでログインしているとき、管理画面の各ページ上部に常時表示するバナー。
 * 書き込み系の Server Action / Route Handler は `requireWriteAdmin()` で 403 / throw するため
 * 安全側に倒れているが、UI 上でも「閲覧専用」を明示してクリック離脱を減らす目的で出す。
 */
export function GuestModeBanner() {
  return (
    <div
      role="status"
      className="mb-6 rounded-card border border-line bg-brand-soft px-4 py-3 text-sm text-ink"
    >
      <p className="font-semibold">ゲストモード（閲覧専用）</p>
      <p className="mt-1 text-xs text-ink-muted">
        デモ用ゲスト管理者アカウントでログイン中です。スポット公開承認・編集・削除・BAN
        等の書き込み操作は受け付けません。
      </p>
    </div>
  );
}
