import { NextResponse } from 'next/server';
import { getSpotDetail } from '@/lib/queries/spotDetail';

type Params = Promise<{ id: string }>;

/**
 * 公開向け GET /api/spots/[id]。
 * 詳細ページ（Server Component）から直接 `getSpotDetail` を叩いているため通常画面では不要だが、
 * 外部連携や将来のクライアント側プリフェッチ用に同じバンドルを JSON で返す。
 *
 * CLAUDE.md「キャッシュ動作は明示的に決める」に沿って Cache-Control を明示。
 * スポット詳細は管理者承認後にしか更新されないため、CDN で 60 秒だけキャッシュし、
 * 失効後は 5 分間 stale を返しつつバックグラウンド再生成する。
 */
const SPOT_DETAIL_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const bundle = await getSpotDetail(id);
  if (!bundle) {
    return NextResponse.json({ error: 'spot_not_found' }, { status: 404 });
  }
  return NextResponse.json(bundle, {
    headers: { 'Cache-Control': SPOT_DETAIL_CACHE_CONTROL },
  });
}
