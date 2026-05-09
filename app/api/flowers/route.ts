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
  const flowers = await getFlowerList();
  return NextResponse.json(
    { flowers },
    { headers: { 'Cache-Control': FLOWER_LIST_CACHE_CONTROL } },
  );
}
