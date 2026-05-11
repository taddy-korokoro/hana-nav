/**
 * 全 flower にプレースホルダー画像を 1 枚ずつ登録するスクリプト。
 *
 * - チケット 16 の「花画像の一括 curate（ローンチ前）」用の最小実装。
 * - 既に active な画像が 1 件以上ある flower はスキップ（再実行可能）。
 * - 実画像は別途運用作業で差し替える前提。
 *
 * 実行：
 *   npx tsx --env-file=.env.local scripts/seed-flower-placeholders.ts
 *
 * 必須 env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  console.error('Run with: npx tsx --env-file=.env.local scripts/seed-flower-placeholders.ts');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function placeholderUrl(name: string): string {
  const text = encodeURIComponent(name);
  return `https://placehold.co/600x400/f4d8e0/8b5a6b?text=${text}`;
}

async function main() {
  const { data: flowers, error } = await admin
    .from('flowers')
    .select('id, name')
    .is('deleted_at', null);
  if (error) {
    console.error('Failed to fetch flowers:', error);
    process.exit(1);
  }
  if (!flowers || flowers.length === 0) {
    console.log('No flowers found. Nothing to do.');
    return;
  }

  let inserted = 0;
  let skipped = 0;
  for (const flower of flowers) {
    const { count, error: countError } = await admin
      .from('images')
      .select('id', { head: true, count: 'exact' })
      .eq('owner_type', 'flower')
      .eq('owner_id', flower.id)
      .is('deleted_at', null);
    if (countError) {
      console.error(`[${flower.name}] failed to count images`, countError);
      continue;
    }
    if ((count ?? 0) > 0) {
      skipped++;
      continue;
    }

    const { error: insertError } = await admin.from('images').insert({
      owner_type: 'flower',
      owner_id: flower.id,
      url: placeholderUrl(flower.name),
      caption: null,
      display_order: 0,
    });
    if (insertError) {
      console.error(`[${flower.name}] failed to insert placeholder image`, insertError);
      continue;
    }
    inserted++;
    console.log(`[${flower.name}] placeholder inserted`);
  }

  console.log(`\nDone. inserted=${inserted}, skipped=${skipped}, total=${flowers.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
