import { NextResponse } from 'next/server';
import { getSpotDetail } from '@/lib/queries/spotDetail';

type Params = Promise<{ id: string }>;

/**
 * 公開向け GET /api/spots/[id]。
 * 詳細ページ（Server Component）から直接 `getSpotDetail` を叩いているため通常画面では不要だが、
 * 外部連携や将来のクライアント側プリフェッチ用に同じバンドルを JSON で返す。
 */
export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const bundle = await getSpotDetail(id);
  if (!bundle) {
    return NextResponse.json({ error: 'spot_not_found' }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
