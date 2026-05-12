'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { COPY } from '@/lib/constants/copy';

type Status = 'all' | 'active' | 'withdrawn';
type Role = 'all' | 'user' | 'admin';

type Props = {
  initialStatus: Status;
  initialRole: Role;
  initialQ: string;
};

/**
 * `/admin/users` の検索フォーム。
 *
 * - 状態 / ロールの select は変更と同時に URL へ反映する
 * - キーワード入力は 300ms デバウンスして URL に反映する
 * - リセットボタンは 3 つの値をすべて初期値に戻し、クエリパラメータを取り除く
 *
 * URL の searchParams は Server Component 側で読まれ、`router.replace` により
 * RSC 再フェッチが走って一覧が再描画される。`useTransition` で再描画の進行状況
 * を取り回し、ユーザー操作とのブロッキングを避ける。
 */
export function UserFilters({ initialStatus, initialRole, initialQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<Status>(initialStatus);
  const [role, setRole] = useState<Role>(initialRole);
  const [q, setQ] = useState<string>(initialQ);

  const c = COPY.admin.users.list.filters;

  const pushUrl = (next: { status: Status; role: Role; q: string }) => {
    const params = new URLSearchParams();
    if (next.status !== 'all') params.set('status', next.status);
    if (next.role !== 'all') params.set('role', next.role);
    const trimmed = next.q.trim();
    if (trimmed) params.set('q', trimmed);
    const search = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${search ? `?${search}` : ''}`);
    });
  };

  // キーワード入力は 300ms デバウンスして URL 反映。直近の URL に乗った値と
  // 一致しているときは push をスキップして無駄な RSC fetch を防ぐ。
  const lastPushedQRef = useRef(initialQ);
  useEffect(() => {
    if (q === lastPushedQRef.current) return;
    const timer = setTimeout(() => {
      lastPushedQRef.current = q;
      pushUrl({ status, role, q });
    }, 300);
    return () => clearTimeout(timer);
    // status / role 変更時は即時 push でカバーするのでここでは依存に含めない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value as Status;
    setStatus(nextStatus);
    lastPushedQRef.current = q;
    pushUrl({ status: nextStatus, role, q });
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = event.target.value as Role;
    setRole(nextRole);
    lastPushedQRef.current = q;
    pushUrl({ status, role: nextRole, q });
  };

  const handleReset = () => {
    setStatus('all');
    setRole('all');
    setQ('');
    lastPushedQRef.current = '';
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <div
      className="mt-8 grid grid-cols-1 gap-3 rounded-card border border-line bg-white p-4 md:grid-cols-[1fr_1fr_2fr_auto]"
      aria-busy={isPending}
    >
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-ink-muted">{c.status}</span>
        <select
          name="status"
          value={status}
          onChange={handleStatusChange}
          className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">{c.statusAll}</option>
          <option value="active">{c.statusActive}</option>
          <option value="withdrawn">{c.statusWithdrawn}</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-ink-muted">{c.role}</span>
        <select
          name="role"
          value={role}
          onChange={handleRoleChange}
          className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">{c.roleAll}</option>
          <option value="user">{c.roleUser}</option>
          <option value="admin">{c.roleAdmin}</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-ink-muted">{c.q}</span>
        <input
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={c.qPlaceholder}
          className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm"
        />
      </label>
      <div className="flex items-end">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm text-ink-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
        >
          {c.reset}
        </button>
      </div>
    </div>
  );
}
