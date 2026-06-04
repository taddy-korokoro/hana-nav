/**
 * 外部ホスト（hanamap.com / *.cloudfront.net）にある画像を Supabase Storage に取り込む。
 *
 * 方針:
 * - hanamap.com の画像は **1920px (長辺) / JPEG q85** にリサイズしてから取り込む
 * - cloudfront の 200x200 サムネイルはそのままアップロード（既に小さい）
 * - パス規約: `{owner_type}/{owner_id}/{display_order}-{img_id}.jpg`
 * - 冪等: 既に Supabase Storage の URL になっている行はスキップ。Storage 側は upsert で上書き
 * - 1 件ずつ Storage upload → DB UPDATE。途中失敗はその行だけスキップしてログに残す
 *
 * 実行:
 *   npx tsx --env-file=.env.local scripts/migrate-images-to-storage.ts [options]
 *
 * Options:
 *   --dry-run                  download + transform はするが Storage upload と DB UPDATE はしない
 *   --owner-type=spot|flower   絞り込み
 *   --limit=N                  処理件数の上限
 *   --concurrency=N            並列数（default: 5）
 *
 * 必須 env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  console.error('Run with: npx tsx --env-file=.env.local scripts/migrate-images-to-storage.ts');
  process.exit(1);
}

const BUCKET = 'images';
const HANAMAP_HOST = 'hanamap.com';
const CLOUDFRONT_HOSTS = ['dadfpmh61h9tr.cloudfront.net', 'd3pbyuzcd27kd.cloudfront.net'];
const STORAGE_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
const FETCH_TIMEOUT_MS = 30_000;
const RESIZE_MAX = 1920;
const JPEG_QUALITY = 85;

// --- CLI args ---
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  ownerType: (args.find((a) => a.startsWith('--owner-type='))?.split('=')[1] ?? undefined) as
    | 'spot'
    | 'flower'
    | undefined,
  limit: Number(
    args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? Number.POSITIVE_INFINITY,
  ),
  concurrency: Math.max(
    1,
    Number(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] ?? 5),
  ),
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ImageRow = {
  id: string;
  owner_type: 'spot' | 'flower';
  owner_id: string;
  url: string;
  display_order: number;
};

function isExternal(url: string): boolean {
  return (
    url.startsWith(`https://${HANAMAP_HOST}/`) ||
    CLOUDFRONT_HOSTS.some((h) => url.startsWith(`https://${h}/`))
  );
}

function shouldResize(url: string): boolean {
  // hanamap はフルサイズの大画像なのでリサイズ。cloudfront は 200x200 サムネなのでそのまま。
  return url.startsWith(`https://${HANAMAP_HOST}/`);
}

function storagePath(row: ImageRow): string {
  return `${row.owner_type}/${row.owner_id}/${row.display_order}-${row.id}.jpg`;
}

async function fetchWithTimeout(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

async function processOne(
  row: ImageRow,
): Promise<{ ok: true; bytes: number } | { ok: false; reason: string }> {
  if (row.url.startsWith(STORAGE_PUBLIC_PREFIX)) {
    return { ok: false, reason: 'already_in_storage' };
  }
  if (!isExternal(row.url)) {
    return { ok: false, reason: 'not_external' };
  }

  let buffer: Buffer;
  try {
    buffer = await fetchWithTimeout(row.url);
  } catch (e) {
    return { ok: false, reason: `download_failed: ${(e as Error).message}` };
  }

  if (shouldResize(row.url)) {
    try {
      buffer = await sharp(buffer)
        .rotate() // EXIF orientation 反映
        .resize({ width: RESIZE_MAX, height: RESIZE_MAX, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
    } catch (e) {
      return { ok: false, reason: `resize_failed: ${(e as Error).message}` };
    }
  }

  if (flags.dryRun) return { ok: true, bytes: buffer.length };

  const path = storagePath(row);
  const uploadRes = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '604800', // 7 days
  });
  if (uploadRes.error) {
    return { ok: false, reason: `upload_failed: ${uploadRes.error.message}` };
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const newUrl = pub.publicUrl;

  const { error: updateError } = await admin
    .from('images')
    .update({ url: newUrl })
    .eq('id', row.id)
    .is('deleted_at', null);
  if (updateError) {
    return { ok: false, reason: `db_update_failed: ${updateError.message}` };
  }

  return { ok: true, bytes: buffer.length };
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

async function main() {
  console.log(
    `[migrate] start ${JSON.stringify({
      dryRun: flags.dryRun,
      ownerType: flags.ownerType,
      limit: flags.limit === Number.POSITIVE_INFINITY ? 'all' : flags.limit,
      concurrency: flags.concurrency,
    })}`,
  );

  let query = admin
    .from('images')
    .select('id, owner_type, owner_id, url, display_order')
    .is('deleted_at', null)
    .or(
      `url.like.https://${HANAMAP_HOST}/%,` +
        CLOUDFRONT_HOSTS.map((h) => `url.like.https://${h}/%`).join(','),
    )
    .order('owner_type', { ascending: true })
    .order('owner_id', { ascending: true })
    .order('display_order', { ascending: true });
  if (flags.ownerType) query = query.eq('owner_type', flags.ownerType);
  if (Number.isFinite(flags.limit)) query = query.limit(flags.limit);

  const { data, error } = await query;
  if (error) {
    console.error('[migrate] fetch failed', error);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log('[migrate] no rows to migrate. done.');
    return;
  }

  const rows = data as ImageRow[];
  console.log(`[migrate] target rows: ${rows.length}`);

  let success = 0;
  let totalBytes = 0;
  const failures: Array<{ id: string; url: string; reason: string }> = [];

  const startedAt = Date.now();
  await runWithConcurrency(rows, flags.concurrency, async (row, idx) => {
    const r = await processOne(row);
    if (r.ok) {
      success++;
      totalBytes += r.bytes;
      if ((idx + 1) % 20 === 0 || idx === rows.length - 1) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        const mb = (totalBytes / (1024 * 1024)).toFixed(2);
        console.log(`  [${idx + 1}/${rows.length}] ok=${success} total=${mb}MB ${elapsed}s`);
      }
    } else {
      failures.push({ id: row.id, url: row.url, reason: r.reason });
      console.warn(`  [${idx + 1}/${rows.length}] FAIL ${r.reason} ${row.url.slice(0, 120)}`);
    }
  });

  console.log('---');
  console.log(`[migrate] done: success=${success} failed=${failures.length}`);
  console.log(`[migrate] uploaded bytes: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  if (failures.length > 0) {
    console.log('[migrate] failures:');
    for (const f of failures.slice(0, 20)) {
      console.log(`  - ${f.id}  ${f.reason}  ${f.url.slice(0, 100)}`);
    }
    if (failures.length > 20) console.log(`  ... (+${failures.length - 20} more)`);
  }
}

main().catch((e) => {
  console.error('[migrate] uncaught', e);
  process.exit(1);
});
