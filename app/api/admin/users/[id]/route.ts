import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminUserDetail, updateUserAdmin } from '@/lib/queries/admin-users';
import { requireAdmin, requireWriteAdminOrResponse } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：ユーザー詳細 / ロール変更・BAN API。
 *
 * - GET: プロフィール・レビュー・ブックマーク・AI 利用履歴を返す
 * - PATCH: `{ role?, deletedAt? }` を受けてロール変更 or BAN(=deleted_at セット) / 解除
 *
 * 自分自身を降格・BAN する事故防止のため、リクエスト元の UID と対象 UID が同じで
 * かつ降格 or BAN になるリクエストは 400 で拒否する。
 */

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ user: detail });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const block = await requireWriteAdminOrResponse();
  if (block) return block;
  const me = await requireAdmin();
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const obj = body as Record<string, unknown>;

  const patch: { role?: 'user' | 'admin'; deletedAt?: string | null } = {};

  if (obj.role !== undefined) {
    if (obj.role !== 'user' && obj.role !== 'admin') {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    patch.role = obj.role;
  }

  if (obj.deletedAt !== undefined) {
    if (obj.deletedAt === null) {
      patch.deletedAt = null;
    } else if (typeof obj.deletedAt === 'string') {
      const parsed = new Date(obj.deletedAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
      }
      patch.deletedAt = parsed.toISOString();
    } else {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
  }

  if (patch.role === undefined && patch.deletedAt === undefined) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  if (id === me.id) {
    if (patch.role && patch.role !== 'admin') {
      return NextResponse.json({ error: 'cannot_self_modify' }, { status: 400 });
    }
    if (patch.deletedAt) {
      return NextResponse.json({ error: 'cannot_self_modify' }, { status: 400 });
    }
  }

  const result = await updateUserAdmin(id, patch);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.code }, { status: 400 });
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  revalidatePath('/admin');
  return NextResponse.json({ ok: true });
}
