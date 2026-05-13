import { NextResponse } from 'next/server';
import { getAiUsageStats } from '@/lib/queries/admin-ai-usage';
import { requireAdmin } from '@/lib/utils/requireAdmin';

/**
 * 管理者向け：AI 利用ログ集計 API。
 * - daily（直近 30 日）
 * - monthly（直近 6 か月）
 * - ranking（直近 30 日の認証済みユーザー上位 20 名）
 * - summary（7d / 30d / 今月 ＋ 推計コスト）
 */
export async function GET() {
  await requireAdmin();
  const stats = await getAiUsageStats();
  return NextResponse.json(stats);
}
