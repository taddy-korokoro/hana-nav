import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminFlowerDetail } from '@/lib/queries/admin';
import { softDeleteFlower, updateFlower } from '@/lib/queries/admin-flower-mutations';
import { requireAdmin } from '@/lib/utils/requireAdmin';
import { parseFlowerBody } from '../route';

/**
 * 管理者向け：花マスター詳細 / 更新 / 論理削除 API。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAdminFlowerDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ flower: detail });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = parseFlowerBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code }, { status: 400 });
  }

  const result = await updateFlower(id, parsed.value);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error.code,
        detail: 'message' in result.error ? result.error.message : undefined,
      },
      { status: 400 },
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/flowers');
  revalidatePath(`/admin/flowers/${id}`);
  revalidatePath('/flowers');
  revalidatePath(`/flowers/${id}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const result = await softDeleteFlower(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.code }, { status: 400 });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/flowers');
  revalidatePath(`/admin/flowers/${id}`);
  revalidatePath('/flowers');
  revalidatePath(`/flowers/${id}`);

  return NextResponse.json({ ok: true });
}
