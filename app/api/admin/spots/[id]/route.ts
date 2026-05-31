import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSpotDetail } from '@/lib/queries/admin';
import {
  setSpotPublished,
  softDeleteSpot,
  updateSpot,
  type SpotFlowerInput,
  type SpotImageInput,
  type SpotMutationInput,
} from '@/lib/queries/admin-spot-mutations';
import { requireAdmin, requireWriteAdminOrResponse } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：スポット詳細 / 更新 / 公開切替 / 論理削除 API。
 *
 * - GET: 1 件取得
 * - PATCH: 全項目更新（`isPublished` だけのトグルもこの API でハンドリング可能。
 *          ボディに `name` 等が無い場合は `is_published` 切替に専念する）
 * - DELETE: 論理削除。子の画像はトリガーでカスケード論理削除される
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAdminSpotDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ spot: detail });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const block = await requireWriteAdminOrResponse();
  if (block) return block;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 公開フラグだけのトグル用ペイロード
  if (
    body &&
    typeof body === 'object' &&
    'isPublished' in body &&
    Object.keys(body as object).length === 1
  ) {
    const next = (body as { isPublished: unknown }).isPublished === true;
    const result = await setSpotPublished(id, next);
    if (!result.ok) {
      return NextResponse.json({ error: result.error.code }, { status: 400 });
    }
    revalidatePath('/admin');
    revalidatePath('/admin/spots');
    revalidatePath('/admin/spots/pending');
    revalidatePath(`/admin/spots/${id}`);
    revalidatePath(`/spots/${id}`);
    revalidatePath('/spots');
    return NextResponse.json({ ok: true });
  }

  const parsed = parseSpotBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code }, { status: 400 });
  }

  const result = await updateSpot(id, parsed.value);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.code }, { status: 400 });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath(`/admin/spots/${id}`);
  revalidatePath(`/spots/${id}`);
  revalidatePath('/spots');

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const block = await requireWriteAdminOrResponse();
  if (block) return block;
  const { id } = await params;

  const result = await softDeleteSpot(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.code }, { status: 400 });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath(`/spots/${id}`);
  revalidatePath('/spots');

  return NextResponse.json({ ok: true });
}

type ParseOk = { ok: true; value: SpotMutationInput };
type ParseErr = { ok: false; code: string };

function parseSpotBody(raw: unknown): ParseOk | ParseErr {
  if (!raw || typeof raw !== 'object') return { ok: false, code: 'invalid_body' };
  const obj = raw as Record<string, unknown>;

  const num = (k: string) =>
    typeof obj[k] === 'number' ? (obj[k] as number) : Number(obj[k] as string);
  const str = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : '');
  const optStr = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : null);

  let images: SpotImageInput[] = [];
  let flowers: SpotFlowerInput[] = [];
  if (Array.isArray(obj.images)) images = obj.images as SpotImageInput[];
  if (Array.isArray(obj.flowers)) flowers = obj.flowers as SpotFlowerInput[];

  return {
    ok: true,
    value: {
      name: str('name'),
      nameKana: optStr('nameKana'),
      description: optStr('description'),
      prefectureId: num('prefectureId'),
      location: str('location'),
      latitude: num('latitude'),
      longitude: num('longitude'),
      bestSeasonStart: num('bestSeasonStart'),
      bestSeasonEnd: num('bestSeasonEnd'),
      officialUrl: optStr('officialUrl'),
      source: optStr('source'),
      accessInfo: optStr('accessInfo'),
      parkingInfo: optStr('parkingInfo'),
      entranceFee: optStr('entranceFee'),
      isPublished: obj.isPublished === true,
      images,
      flowers,
    },
  };
}
