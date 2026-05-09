import { NextResponse } from 'next/server';
import { getAllPrefectures } from '@/lib/queries/areas';

/**
 * 公開向け GET /api/prefectures。
 * 47 都道府県の固定マスター。アプリからは更新しないので 1 時間 + stale 1 日でキャッシュ。
 */
const PREFECTURES_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET() {
  try {
    const prefectures = await getAllPrefectures();
    return NextResponse.json(
      { prefectures },
      { headers: { 'Cache-Control': PREFECTURES_CACHE_CONTROL } },
    );
  } catch (error) {
    console.error('[GET /api/prefectures] failed', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
