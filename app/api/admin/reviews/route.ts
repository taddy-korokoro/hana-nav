import { NextResponse } from 'next/server';
import { listAdminReviews } from '@/lib/queries/admin-reviews';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：レビュー一覧 API。
 *
 * - GET: status / ngOnly / q でフィルタ。NG ワード検知は JS 側（lib/ng-words）で行う。
 */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const ngOnly = url.searchParams.get('ngOnly') === 'true';
  const q = url.searchParams.get('q')?.trim() || undefined;

  const reviews = await listAdminReviews({
    status:
      status === 'active' || status === 'deleted' || status === 'all'
        ? (status as 'all' | 'active' | 'deleted')
        : undefined,
    ngOnly,
    q,
  });

  return NextResponse.json({ items: reviews });
}
