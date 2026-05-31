import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  createSpot,
  type SpotMutationInput,
  type SpotFlowerInput,
  type SpotImageInput,
} from '@/lib/queries/admin-spot-mutations';
import { listAdminSpots } from '@/lib/queries/admin';
import { requireAdmin, requireWriteAdminOrResponse } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：スポット一覧 / 新規作成 API。
 *
 * - GET: フィルタ（status / prefecture / q）でスポット一覧を返す
 * - POST: 新規スポットを作成。本体は Server Action と同じ `createSpot` を呼ぶ
 *
 * `requireAdmin()` で `getUser()` → `profiles.role === 'admin'` を検証する。
 * 非 admin の場合は `/` リダイレクトに倒れるため、API としては 302 を返す形になる点に注意。
 */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const prefRaw = url.searchParams.get('prefecture');
  const q = url.searchParams.get('q')?.trim() || undefined;

  const prefectureId = prefRaw ? Number.parseInt(prefRaw, 10) : NaN;

  const spots = await listAdminSpots({
    status:
      status === 'published' || status === 'unpublished' || status === 'all' ? status : undefined,
    prefectureId:
      Number.isInteger(prefectureId) && prefectureId >= 1 && prefectureId <= 47
        ? prefectureId
        : undefined,
    q,
  });

  return NextResponse.json({ items: spots });
}

export async function POST(request: Request) {
  const block = await requireWriteAdminOrResponse();
  if (block) return block;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = parseSpotBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code }, { status: 400 });
  }

  const result = await createSpot(parsed.value);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.code }, { status: 400 });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/spots');
  revalidatePath('/admin/spots/pending');
  revalidatePath('/spots');

  return NextResponse.json({ id: result.id }, { status: 201 });
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
