import { NextResponse } from 'next/server';
import { getFlowerList } from '@/lib/queries/flowers';

/**
 * 公開向け GET /api/flowers。
 * 一覧ページ（Server Component）から直接 `getFlowerList` を叩いているため通常画面では不要だが、
 * 外部連携・将来のクライアント側プリフェッチ用に同じ shape の JSON を返す。
 *
 * 花マスターは管理者承認後にしか更新されないので CDN で 60 秒キャッシュ + 5 分 stale。
 */
const FLOWER_LIST_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

export async function GET() {
  // getFlowerList が DB エラー時に throw するようになったので、API 経由の呼び出しは
  // ここで 500 化する必要がある。throw のままだと Next.js の既定 500 ページ HTML が
  // 返り、外部 JSON クライアントが扱えなくなる。
  try {
    const flowers = await getFlowerList();
    return NextResponse.json(
      { flowers },
      { headers: { 'Cache-Control': FLOWER_LIST_CACHE_CONTROL } },
    );
  } catch (error) {
    console.error('[GET /api/flowers] failed', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
