import { NextResponse } from 'next/server';
import { listAdminUsers } from '@/lib/queries/admin-users';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：ユーザー一覧 API。
 *
 * - GET: status / role / q でフィルタ
 *
 * `requireAdmin()` で `getUser()` → `profiles.role === 'admin'` を検証する。
 */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const role = url.searchParams.get('role');
  const q = url.searchParams.get('q')?.trim() || undefined;

  const users = await listAdminUsers({
    status: status === 'active' || status === 'withdrawn' || status === 'all' ? status : undefined,
    role: role === 'user' || role === 'admin' || role === 'all' ? role : undefined,
    q,
  });

  return NextResponse.json({ items: users });
}
