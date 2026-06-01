import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  createFlower,
  type FlowerAliasInput,
  type FlowerImageInput,
  type FlowerMutationInput,
} from '@/lib/queries/admin-flower-mutations';
import { listAdminFlowers } from '@/lib/queries/admin';
import { requireAdmin, requireWriteAdminOrResponse } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：花マスター一覧 / 新規作成 API。
 * Server Action と同じロジック（`createFlower`）を呼ぶ。外部スクリプトからの登録や
 * 将来の連携用に Route Handler も用意する。
 */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() || undefined;
  const items = await listAdminFlowers({ q });
  return NextResponse.json({ items });
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

  const parsed = parseFlowerBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code }, { status: 400 });
  }

  const result = await createFlower(parsed.value);
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
  revalidatePath('/flowers');

  return NextResponse.json({ id: result.id }, { status: 201 });
}

type ParseOk = { ok: true; value: FlowerMutationInput };
type ParseErr = { ok: false; code: string };

export function parseFlowerBody(raw: unknown): ParseOk | ParseErr {
  if (!raw || typeof raw !== 'object') return { ok: false, code: 'invalid_body' };
  const obj = raw as Record<string, unknown>;

  const str = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : '');
  const optStr = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : null);
  const optNum = (k: string) => {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  let images: FlowerImageInput[] = [];
  let aliases: FlowerAliasInput[] = [];
  if (Array.isArray(obj.images)) images = obj.images as FlowerImageInput[];
  if (Array.isArray(obj.aliases)) aliases = obj.aliases as FlowerAliasInput[];

  return {
    ok: true,
    value: {
      name: str('name'),
      nameKana: optStr('nameKana'),
      description: optStr('description'),
      defaultSeasonStart: optNum('defaultSeasonStart'),
      defaultSeasonEnd: optNum('defaultSeasonEnd'),
      images,
      aliases,
    },
  };
}
