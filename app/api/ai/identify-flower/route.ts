import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * AI 花判定エンドポイント。
 *
 * - ユーザー識別: 認証 Cookie から `getUser()` で取得（クライアントから userId を受け取らない）
 *   → 匿名のフリをしてレート制限を回避できないようにする
 * - レート制限: 匿名 1 / 日、ログイン 3 / 日（`reward_unlocked` で +5 ずつ）
 * - Gemini 呼び出し: 画像 + 構造化 JSON プロンプト → flower_name (総称) で 3 段階マッチング
 * - 結果に紐づく公開スポットを最大 5 件返す
 *
 * `flowers` / `flower_aliases` / `images` / `spots` / `spot_flowers` の SELECT は
 * 公開系テーブルなので anon でも RLS を通過するが、`ai_usage_logs` への INSERT は
 * RLS 上制限したいので Service Role を使って書き込む。
 */

const RATE_LIMIT_ANON = 1;
const RATE_LIMIT_AUTH = 3;
const RATE_LIMIT_REWARD_BONUS = 5;

// CLAUDE.md「Supabase クライアントはリクエストごとに新規生成する（モジュール
// スコープでキャッシュしない）」に揃えるため、Service Role / Gemini いずれも
// リクエスト時に初期化する。Service Role はクッキー非依存だが規約整合性を優先。
function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
}

type RateLimitInfo = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
};

async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  userId: string | null,
  anonId: string | null,
): Promise<RateLimitInfo> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let query = supabaseAdmin
    .from('ai_usage_logs')
    .select('id, reward_unlocked')
    .gte('used_at', todayStart.toISOString())
    .is('deleted_at', null);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonId) {
    query = query.eq('anonymous_id', anonId);
  } else {
    // どちらの識別子も無い場合は判定不能。安全側で 0 / 0 を返す。
    return { allowed: false, used: 0, limit: 0, remaining: 0 };
  }

  const { data, error } = await query;
  if (error) throw error;

  const baseLimit = userId ? RATE_LIMIT_AUTH : RATE_LIMIT_ANON;
  const rewardCount = data?.filter((r) => r.reward_unlocked).length ?? 0;
  const usedCount = data?.length ?? 0;
  const totalLimit = baseLimit + rewardCount * RATE_LIMIT_REWARD_BONUS;

  return {
    allowed: usedCount < totalLimit,
    used: usedCount,
    limit: totalLimit,
    remaining: Math.max(0, totalLimit - usedCount),
  };
}

type AiResult = {
  flower_name?: string;
  flower_variety?: string;
  confidence?: number;
  bloom_status?: string;
  description?: string;
  flower_language?: string;
  fun_fact?: string;
  best_viewing_months?: string;
  is_flower?: boolean;
};

const PROMPT = `
あなたは日本の植物分類学の専門家です。
この画像に写っている花を判定し、必ず以下のJSON形式のみで回答してください。
他のテキストや説明、マークダウンは絶対に含めないでください。

{
  "flower_name": "日本で一般的に使われる総称（マッチング用。例：「ソメイヨシノ」ではなく「桜」）",
  "flower_variety": "品種名（例：ソメイヨシノ、ヤマザクラ）",
  "confidence": 0.0から1.0の数値,
  "bloom_status": "つぼみ/見頃/終わりかけ のいずれか",
  "description": "花の特徴を120文字以内で説明（色、形状、葉、香りなど）",
  "flower_language": "代表的な花言葉を2〜3個（例：愛、思いやり、永遠の幸せ）",
  "fun_fact": "豆知識を100文字以内で（由来、見分け方、文化的背景など）",
  "best_viewing_months": "一般的な開花時期（例：4月〜5月）",
  "is_flower": true か false（花以外なら false）
}

判定が難しい場合は confidence を低く設定してください。
flower_name は必ず総称（マッチング用）を返し、flower_variety で品種名を補足してください。
`;

export async function GET(request: NextRequest) {
  // クライアントが利用状況バナーで残回数を表示するための軽量エンドポイント。
  // 認証ユーザーは Cookie から、匿名ユーザーは ?anonId= で識別する。
  const anonId = request.nextUrl.searchParams.get('anonId');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const limit = await checkRateLimit(supabaseAdmin, userId, anonId);
    return NextResponse.json(
      {
        authenticated: !!userId,
        used: limit.used,
        limit: limit.limit,
        remaining: limit.remaining,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('[GET /api/ai/identify-flower] rate limit check failed', error);
    return NextResponse.json({ error: 'rate_limit_check_failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'gemini_api_key_missing' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  }

  const imageFile = formData.get('image');
  const anonId = (formData.get('anonId') as string | null) || null;

  if (!(imageFile instanceof File)) {
    return NextResponse.json({ error: 'image_required' }, { status: 400 });
  }
  if (imageFile.size > 5 * 1024 * 1024) {
    // クライアント側で 2MB 以下に圧縮済みの想定。それを大きく超える場合は弾く。
    return NextResponse.json({ error: 'image_too_large' }, { status: 413 });
  }

  // 認証ユーザーは Cookie から取得。クライアントが userId を詐称してもここでは無視される。
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  if (!userId && !anonId) {
    return NextResponse.json({ error: 'anon_id_required' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const limit = await checkRateLimit(supabaseAdmin, userId, anonId);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: '本日のAI判定回数の上限に達しました',
          remaining: 0,
          limit: limit.limit,
          showAdReward: true,
        },
        { status: 429 },
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      PROMPT,
      { inlineData: { mimeType: imageFile.type || 'image/jpeg', data: base64Image } },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

    let aiResult: AiResult;
    try {
      aiResult = JSON.parse(cleanJson) as AiResult;
    } catch (parseError) {
      console.error('[POST /api/ai/identify-flower] AI response parse failed', parseError, {
        responseText,
      });
      return NextResponse.json({ error: 'ai_response_parse_failed' }, { status: 502 });
    }

    const flowerNameForMatch = (aiResult.flower_name ?? '').trim();
    const flowerVarietyForMatch = (aiResult.flower_variety ?? '').trim();

    let flowerMatch: FlowerRow | null = null;

    if (flowerNameForMatch) {
      // 1. flowers.name 完全一致
      const { data, error } = await supabaseAdmin
        .from('flowers')
        .select('id, name, description, default_season_start, default_season_end')
        .eq('name', flowerNameForMatch)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      flowerMatch = (data as FlowerRow | null) ?? null;
    }

    if (!flowerMatch && flowerNameForMatch) {
      // 2. flower_aliases.alias に完全一致
      flowerMatch = await matchByAlias(supabaseAdmin, flowerNameForMatch);
    }
    if (!flowerMatch && flowerVarietyForMatch) {
      // 3. flower_variety で alias 検索
      flowerMatch = await matchByAlias(supabaseAdmin, flowerVarietyForMatch);
    }

    let flowerImages: { id: string; url: string; caption: string | null; display_order: number }[] =
      [];
    if (flowerMatch) {
      const { data, error } = await supabaseAdmin
        .from('images')
        .select('id, url, caption, display_order')
        .eq('owner_type', 'flower')
        .eq('owner_id', flowerMatch.id)
        .is('deleted_at', null)
        .order('display_order', { ascending: true });
      if (error) throw error;
      flowerImages = data ?? [];
    }

    let recommendedSpots: RecommendedSpot[] = [];
    if (flowerMatch) {
      recommendedSpots = await fetchRecommendedSpots(supabaseAdmin, flowerMatch.id);
    }

    const { error: logError } = await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: userId,
      anonymous_id: userId ? null : anonId,
    });
    if (logError) {
      // ログ失敗で結果を破棄する必要はないが、可観測性のために残す
      console.error('[POST /api/ai/identify-flower] failed to insert usage log', logError);
    }

    return NextResponse.json({
      success: true,
      ai_result: aiResult,
      flower_master: flowerMatch,
      flower_images: flowerImages,
      recommended_spots: recommendedSpots,
      rate_limit: {
        used: limit.used + 1,
        limit: limit.limit,
        remaining: Math.max(0, limit.remaining - 1),
      },
    });
  } catch (error) {
    console.error('[POST /api/ai/identify-flower] failed', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'internal_error',
        // 本番では詳細を漏らさない。dev のみ生メッセージを返してデバッグを容易にする。
        ...(process.env.NODE_ENV !== 'production' ? { detail: message } : {}),
      },
      { status: 500 },
    );
  }
}

type FlowerRow = {
  id: string;
  name: string;
  description: string | null;
  default_season_start: number | null;
  default_season_end: number | null;
};

type RecommendedSpot = {
  id: string;
  name: string;
  location: string;
  official_url: string | null;
  best_season_start: number;
  best_season_end: number;
  prefecture_name: string;
  cover_image_url: string | null;
};

async function matchByAlias(
  supabaseAdmin: SupabaseClient,
  alias: string,
): Promise<FlowerRow | null> {
  const { data, error } = await supabaseAdmin
    .from('flower_aliases')
    .select(
      'flowers!inner(id, name, description, default_season_start, default_season_end, deleted_at)',
    )
    .eq('alias', alias)
    .is('deleted_at', null)
    .is('flowers.deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  type Row = {
    flowers:
      | (FlowerRow & { deleted_at: string | null })
      | (FlowerRow & { deleted_at: string | null })[]
      | null;
  };
  const flowersField = (data as Row).flowers;
  const flower = Array.isArray(flowersField) ? flowersField[0] : flowersField;
  if (!flower) return null;
  return {
    id: flower.id,
    name: flower.name,
    description: flower.description,
    default_season_start: flower.default_season_start,
    default_season_end: flower.default_season_end,
  };
}

async function fetchRecommendedSpots(
  supabaseAdmin: SupabaseClient,
  flowerId: string,
): Promise<RecommendedSpot[]> {
  const { data, error } = await supabaseAdmin
    .from('spots')
    .select(
      `
      id, name, location, official_url, best_season_start, best_season_end,
      prefecture:prefectures(name),
      spot_flowers!inner(flower_id, deleted_at)
    `,
    )
    .eq('spot_flowers.flower_id', flowerId)
    .eq('is_published', true)
    .is('deleted_at', null)
    .is('spot_flowers.deleted_at', null)
    .limit(5);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const spotIds = data.map((s) => s.id);
  const { data: imageRows } = await supabaseAdmin
    .from('images')
    .select('owner_id, url, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', spotIds)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  const coverByOwner = new Map<string, string>();
  for (const img of imageRows ?? []) {
    if (!coverByOwner.has(img.owner_id)) coverByOwner.set(img.owner_id, img.url);
  }

  type Row = {
    id: string;
    name: string;
    location: string;
    official_url: string | null;
    best_season_start: number;
    best_season_end: number;
    prefecture: { name: string } | { name: string }[] | null;
  };

  return (data as unknown as Row[]).map((s) => {
    const pref = Array.isArray(s.prefecture) ? s.prefecture[0] : s.prefecture;
    return {
      id: s.id,
      name: s.name,
      location: s.location,
      official_url: s.official_url,
      best_season_start: s.best_season_start,
      best_season_end: s.best_season_end,
      prefecture_name: pref?.name ?? '',
      cover_image_url: coverByOwner.get(s.id) ?? null,
    };
  });
}
