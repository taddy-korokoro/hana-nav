import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { restoreReviewAdmin, softDeleteReviewAdmin } from '@/lib/queries/admin-reviews';
import { requireWriteAdminOrResponse } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：レビュー強制論理削除 / 復元 API。
 *
 * - DELETE: `reviews.deleted_at` を NOW() に
 * - POST {action:'restore'}: 復元（`deleted_at` を NULL に戻す）
 */

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const block = await requireWriteAdminOrResponse();
  if (block) return block;
  const { id } = await params;
  const result = await softDeleteReviewAdmin(id);
  if (!result.ok) {
    const status = result.error.code === 'not_found' ? 404 : 400;
    return NextResponse.json({ error: result.error.code }, { status });
  }
  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const block = await requireWriteAdminOrResponse();
  if (block) return block;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const action = (body as { action?: unknown } | null)?.action;
  if (action !== 'restore') {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const result = await restoreReviewAdmin(id);
  if (!result.ok) {
    const status = result.error.code === 'not_found' ? 404 : 400;
    return NextResponse.json({ error: result.error.code }, { status });
  }
  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  return NextResponse.json({ ok: true });
}
