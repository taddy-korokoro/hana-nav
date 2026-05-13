import { COPY } from '@/lib/constants/copy';

/**
 * 管理画面で再利用するピル型バッジ群。COPY を直接参照するので呼び出し側は
 * 値だけ渡せばよい。色味も全ページで揃えるため class はここでハードコードする。
 */

type RoleBadgeProps = {
  role: 'user' | 'admin';
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const label = COPY.admin.users.list.roleLabels[role] ?? role;
  const cls =
    role === 'admin'
      ? 'inline-flex items-center rounded-pill bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand'
      : 'inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-muted';
  return <span className={cls}>{label}</span>;
}

type WithdrawnBadgeProps = {
  /** profiles.deleted_at != null を表すフラグ */
  isWithdrawn: boolean;
};

export function WithdrawnBadge({ isWithdrawn }: WithdrawnBadgeProps) {
  const labels = COPY.admin.users.list.statusBadge;
  if (isWithdrawn) {
    return (
      <span className="inline-flex items-center rounded-pill bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        {labels.withdrawn}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {labels.active}
    </span>
  );
}

type ReviewStatusBadgeProps = {
  /** reviews.deleted_at != null を表すフラグ */
  isDeleted: boolean;
};

export function ReviewStatusBadge({ isDeleted }: ReviewStatusBadgeProps) {
  const labels = COPY.admin.reviews.list.statusBadge;
  if (isDeleted) {
    return (
      <span className="inline-flex items-center rounded-pill bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        {labels.deleted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {labels.active}
    </span>
  );
}
