# AI 花判定（`/api/ai/identify-flower`）

## フロー

1. クライアントが画像を `FormData` で送信（クライアント側で2MB以下にリサイズ済み）
2. `ai_usage_logs` で本日の利用回数をチェック（レート制限）
3. Gemini API (`gemini-2.5-flash`) に画像 + プロンプトを送信
4. 返却された `flower_name`（総称）を `flowers.name` → `flower_aliases.alias` の順でマッチング（3段階フォールバック）
5. マッチした花に紐づくスポットを最大5件取得して返却
6. `ai_usage_logs` にレコードを挿入

AI に「総称（マッチング用）」と「品種名（表示用）」の両方を返させることでマッチング成功率を上げる。

## 実装（`app/api/ai/identify-flower/route.ts`）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRateLimit(userId: string | null, anonId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let query = supabaseAdmin
    .from('ai_usage_logs')
    .select('id, reward_unlocked')
    .gte('used_at', todayStart.toISOString())
    .is('deleted_at', null);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('anonymous_id', anonId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const baseLimit = userId ? 3 : 1;
  const rewardCount = data?.filter(r => r.reward_unlocked).length || 0;
  const usedCount = data?.length || 0;
  const totalLimit = baseLimit + rewardCount * 5;

  return {
    allowed: usedCount < totalLimit,
    used: usedCount,
    limit: totalLimit,
    remaining: Math.max(0, totalLimit - usedCount),
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userId = formData.get('userId') as string | null;
    const anonId = formData.get('anonId') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    const limit = await checkRateLimit(userId, anonId);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: '本日のAI判定回数の上限に達しました',
          remaining: 0,
          showAdReward: true,
        },
        { status: 429 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
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

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: imageFile.type, data: base64Image } },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

    let aiResult;
    try {
      aiResult = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json({ error: 'AI response parse failed' }, { status: 500 });
    }

    // flowersマスターとのマッチング（3段階フォールバック）
    // 1. flowers.name に完全一致
    let { data: flowerMatch } = await supabaseAdmin
      .from('flowers')
      .select('*')
      .eq('name', aiResult.flower_name)
      .is('deleted_at', null)
      .maybeSingle();

    // 2. flower_aliases.alias に完全一致
    if (!flowerMatch) {
      const { data: aliasMatch } = await supabaseAdmin
        .from('flower_aliases')
        .select('flower_id, flowers!inner(*)')
        .eq('alias', aiResult.flower_name)
        .is('deleted_at', null)
        .maybeSingle();

      if (aliasMatch) {
        flowerMatch = (aliasMatch as any).flowers;
      } else if (aiResult.flower_variety) {
        // 3. flower_variety（品種名）でエイリアス検索
        const { data: varietyMatch } = await supabaseAdmin
          .from('flower_aliases')
          .select('flower_id, flowers!inner(*)')
          .eq('alias', aiResult.flower_variety)
          .is('deleted_at', null)
          .maybeSingle();

        if (varietyMatch) {
          flowerMatch = (varietyMatch as any).flowers;
        }
      }
    }

    // 花マスターの画像を取得
    let flowerImages: any[] = [];
    if (flowerMatch) {
      const { data } = await supabaseAdmin
        .from('images')
        .select('id, url, caption, display_order')
        .eq('owner_type', 'flower')
        .eq('owner_id', flowerMatch.id)
        .is('deleted_at', null)
        .order('display_order');
      flowerImages = data || [];
    }

    // 利用ログ記録
    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: userId,
      anonymous_id: anonId,
    });

    // 関連スポットを取得（最大5件）
    let recommendedSpots: any[] = [];
    if (flowerMatch) {
      const { data: spotsData } = await supabaseAdmin
        .from('spots')
        .select(`
          id, name, location, official_url, best_season_start, best_season_end,
          prefecture:prefectures(id, name, region),
          spot_flowers!inner(flower_id)
        `)
        .eq('spot_flowers.flower_id', flowerMatch.id)
        .eq('is_published', true)
        .is('deleted_at', null)
        .limit(5);

      if (spotsData && spotsData.length > 0) {
        const spotIds = spotsData.map(s => s.id);
        const { data: spotImagesData } = await supabaseAdmin
          .from('images')
          .select('owner_id, url')
          .eq('owner_type', 'spot')
          .in('owner_id', spotIds)
          .eq('display_order', 0)
          .is('deleted_at', null);

        const imageMap = new Map(
          (spotImagesData || []).map(img => [img.owner_id, img.url])
        );

        recommendedSpots = spotsData.map(spot => ({
          ...spot,
          cover_image: imageMap.get(spot.id) || null,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      ai_result: aiResult,
      flower_master: flowerMatch,
      flower_images: flowerImages,
      recommended_spots: recommendedSpots,
      rate_limit: {
        remaining: limit.remaining - 1,
        limit: limit.limit,
      },
    });
  } catch (error) {
    console.error('AI判定エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
```

## 判定結果 UI レイアウト（PictureThis 風）

```
┌──────────────────────────┐
│  [ユーザーが撮った写真]   │
├──────────────────────────┤
│  🌸 チューリップ          │
│  信頼度: 95%             │
│  📊 開花状況: 見頃        │
│                          │
│  📝 特徴                 │
│  カップ状の花を持つ早春の  │
│  代表的な球根植物。       │
│                          │
│  💐 花言葉               │
│  愛、思いやり、永遠の幸せ  │
│                          │
│  💡 豆知識               │
│  オランダが原産地と思われ  │
│  がちだが実は中央アジア。  │
│                          │
│  📍 この花が見られるスポット│
│  [スポットカード×最大5件]  │
│                          │
│  [🎨 旅のしおりを作る]    │
└──────────────────────────┘
```
