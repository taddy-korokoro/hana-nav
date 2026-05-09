import { NextResponse } from 'next/server';
import { getFlowerDetail } from '@/lib/queries/flowers';

type Params = Promise<{ id: string }>;

/**
 * 公開向け GET /api/flowers/[id]。
 * 詳細ページ（Server Component）から直接 `getFlowerDetail` を叩いているため通常画面では不要だが、
 * 外部連携・将来のクライアント側プリフェッチ用に同じバンドルを JSON で返す。
 *
 * /api/spots/[id] と同じく CDN で 60 秒キャッシュ + 5 分 stale。
 */
const FLOWER_DETAIL_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  // getFlowerDetail は not-found のみ null、DB エラーは throw するようになった。
  // API 経由では JSON で 500 を返す必要があるので try/catch でラップする。
  try {
    const bundle = await getFlowerDetail(id);
    if (!bundle) {
      return NextResponse.json({ error: 'flower_not_found' }, { status: 404 });
    }
    return NextResponse.json(bundle, {
      headers: { 'Cache-Control': FLOWER_DETAIL_CACHE_CONTROL },
    });
  } catch (error) {
    console.error('[GET /api/flowers/[id]] failed', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
