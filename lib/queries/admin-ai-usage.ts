import { connection } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * `/admin/ai-usage` 用集計クエリ。日別 / 月別の利用件数と、認証済みユーザーの
 * 利用ランキングを返す。匿名利用は anonymous_id で識別され、ランキングからは除外。
 *
 * Service Role 前提（呼び出し側で `requireAdmin()` を必ず通す）。
 */

// Gemini Flash の概算コスト。リクエスト平均 ~$0.001 を 150 円/$ で換算した値（ざっくり）。
// 実コストは画像サイズや出力長で揺れるため、画面上に注釈を出して目安として扱う。
export const ESTIMATED_YEN_PER_CALL = 0.15;

export type AiUsageSummary = {
  last7Days: { anonymous: number; authenticated: number; total: number };
  last30Days: { anonymous: number; authenticated: number; total: number };
  thisMonth: { anonymous: number; authenticated: number; total: number };
  estimatedCostThisMonthYen: number;
};

export type AiUsageDailyRow = {
  date: string; // YYYY-MM-DD (JST)
  anonymous: number;
  authenticated: number;
  total: number;
};

export type AiUsageMonthlyRow = {
  month: string; // YYYY-MM (JST)
  anonymous: number;
  authenticated: number;
  total: number;
};

export type AiUsageRankRow = {
  userId: string;
  username: string | null;
  isWithdrawn: boolean;
  count: number;
  rewardUnlockedCount: number;
};

type LogRow = {
  user_id: string | null;
  anonymous_id: string | null;
  used_at: string;
  reward_unlocked: boolean;
};

function toJstDate(iso: string): string {
  // ISO → JST 日付（YYYY-MM-DD）
  const d = new Date(iso);
  // 9 時間進めて UTC として扱う
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function toJstMonth(iso: string): string {
  return toJstDate(iso).slice(0, 7);
}

export async function getAiUsageStats(): Promise<{
  summary: AiUsageSummary;
  daily: AiUsageDailyRow[];
  monthly: AiUsageMonthlyRow[];
  ranking: AiUsageRankRow[];
}> {
  // cacheComponents 下で new Date() を呼ぶ前に request-time シグナルを出す。
  // 管理画面は per-request 計算が必要（ランキング・直近 N 日集計など）で、
  // キャッシュも意図的に避けるため connection() で dynamic 評価に固定する。
  await connection();
  const admin = createAdminClient();

  const now = new Date();
  // 直近 6 か月の月初（JST 基準で安全側に倒し UTC で 1 日前にしておく）
  const sixMonthsAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1, -9, 0, 0),
  ).toISOString();

  // 直近 30 日 ＋ 月別比較のために 6 か月分まとめて取る
  const { data, error } = await admin
    .from('ai_usage_logs')
    .select('user_id, anonymous_id, used_at, reward_unlocked')
    .is('deleted_at', null)
    .gte('used_at', sixMonthsAgo)
    .order('used_at', { ascending: false })
    .limit(20000);

  if (error) {
    console.error('[getAiUsageStats] failed', error);
    return {
      summary: emptySummary(),
      daily: [],
      monthly: [],
      ranking: [],
    };
  }

  const logs = (data ?? []) as LogRow[];

  // 集計区間（JST 基準）
  const nowMs = now.getTime();
  const day = 24 * 60 * 60 * 1000;
  const last7 = nowMs - 7 * day;
  const last30 = nowMs - 30 * day;

  const jstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
  const monthKey = jstNow.toISOString().slice(0, 7);

  let s7Anon = 0,
    s7Auth = 0;
  let s30Anon = 0,
    s30Auth = 0;
  let sMonthAnon = 0,
    sMonthAuth = 0;

  // 日別集計（直近 30 日）
  const dailyMap = new Map<string, { anonymous: number; authenticated: number }>();
  // 月別集計（直近 6 か月）
  const monthlyMap = new Map<string, { anonymous: number; authenticated: number }>();
  // ランキング（直近 30 日、認証済みのみ）
  const userMap = new Map<string, { count: number; rewardUnlockedCount: number }>();

  for (const r of logs) {
    const t = new Date(r.used_at).getTime();
    const isAuth = !!r.user_id;
    const dateKey = toJstDate(r.used_at);
    const monthK = toJstMonth(r.used_at);

    // 月別
    const mEntry = monthlyMap.get(monthK) ?? { anonymous: 0, authenticated: 0 };
    if (isAuth) mEntry.authenticated++;
    else mEntry.anonymous++;
    monthlyMap.set(monthK, mEntry);

    // 直近 30 日内のみ日別 & ランキング
    if (t >= last30) {
      const dEntry = dailyMap.get(dateKey) ?? { anonymous: 0, authenticated: 0 };
      if (isAuth) dEntry.authenticated++;
      else dEntry.anonymous++;
      dailyMap.set(dateKey, dEntry);

      if (isAuth) s30Auth++;
      else s30Anon++;

      if (isAuth && r.user_id) {
        const e = userMap.get(r.user_id) ?? { count: 0, rewardUnlockedCount: 0 };
        e.count++;
        if (r.reward_unlocked) e.rewardUnlockedCount++;
        userMap.set(r.user_id, e);
      }
    }

    if (t >= last7) {
      if (isAuth) s7Auth++;
      else s7Anon++;
    }

    if (monthK === monthKey) {
      if (isAuth) sMonthAuth++;
      else sMonthAnon++;
    }
  }

  // 日別行を 30 日分埋める（ない日は 0 件で並べる）
  const daily: AiUsageDailyRow[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowMs - i * day);
    const key = toJstDate(d.toISOString());
    const entry = dailyMap.get(key) ?? { anonymous: 0, authenticated: 0 };
    daily.push({
      date: key,
      anonymous: entry.anonymous,
      authenticated: entry.authenticated,
      total: entry.anonymous + entry.authenticated,
    });
  }

  // 月別行を 6 か月分埋める
  const monthly: AiUsageMonthlyRow[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = toJstMonth(d.toISOString());
    const entry = monthlyMap.get(key) ?? { anonymous: 0, authenticated: 0 };
    monthly.push({
      month: key,
      anonymous: entry.anonymous,
      authenticated: entry.authenticated,
      total: entry.anonymous + entry.authenticated,
    });
  }

  // ランキング上位 20 名のユーザー情報を引いて整形
  const ranking: AiUsageRankRow[] = [];
  if (userMap.size > 0) {
    const sorted = [...userMap.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 20);
    const ids = sorted.map(([id]) => id);

    const { data: profiles, error: pErr } = await admin
      .from('profiles')
      .select('id, username, deleted_at')
      .in('id', ids);
    if (pErr) console.error('[getAiUsageStats] profiles fetch failed', pErr);

    const pMap = new Map<string, { username: string | null; deleted_at: string | null }>();
    for (const p of (profiles ?? []) as {
      id: string;
      username: string | null;
      deleted_at: string | null;
    }[]) {
      pMap.set(p.id, { username: p.username, deleted_at: p.deleted_at });
    }

    for (const [id, e] of sorted) {
      const p = pMap.get(id);
      ranking.push({
        userId: id,
        username: p?.username ?? null,
        isWithdrawn: p?.deleted_at != null,
        count: e.count,
        rewardUnlockedCount: e.rewardUnlockedCount,
      });
    }
  }

  const summary: AiUsageSummary = {
    last7Days: { anonymous: s7Anon, authenticated: s7Auth, total: s7Anon + s7Auth },
    last30Days: { anonymous: s30Anon, authenticated: s30Auth, total: s30Anon + s30Auth },
    thisMonth: {
      anonymous: sMonthAnon,
      authenticated: sMonthAuth,
      total: sMonthAnon + sMonthAuth,
    },
    estimatedCostThisMonthYen: Math.round((sMonthAnon + sMonthAuth) * ESTIMATED_YEN_PER_CALL),
  };

  return { summary, daily, monthly, ranking };
}

function emptySummary(): AiUsageSummary {
  return {
    last7Days: { anonymous: 0, authenticated: 0, total: 0 },
    last30Days: { anonymous: 0, authenticated: 0, total: 0 },
    thisMonth: { anonymous: 0, authenticated: 0, total: 0 },
    estimatedCostThisMonthYen: 0,
  };
}
