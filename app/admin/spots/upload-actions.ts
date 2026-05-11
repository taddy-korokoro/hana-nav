'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/utils/requireAdmin';

const BUCKET = 'images';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; code: 'upload_invalid_type' | 'upload_too_large' | 'upload_failed' | 'no_file' };

/**
 * 管理画面のスポット画像アップロード Server Action。
 *
 * - `images` バケットは public ですが INSERT は Service Role のみ許可しているため、
 *   ブラウザの anon クライアントから直接 PUT できない。よって Server Action 経由で上げる。
 * - クライアント側で 1024px / JPEG 0.8 / 2MB 以下にリサイズ済みの想定。サーバー側でも
 *   MIME / サイズチェックを再度かけて多層防御する。
 * - パスは `spots/YYYY-MM/{timestamp}-{rand}.{ext}` 形式。スポット未作成（新規作成画面）でも
 *   先にアップロードできるよう、所有者に紐付けないフラットな配置にしている。
 *   フォームが abandon された場合の孤児ファイルは MVP では清掃しない（Storage の容量影響は軽微）。
 */
export async function uploadSpotImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, code: 'no_file' };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, code: 'upload_invalid_type' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, code: 'upload_too_large' };
  }

  const admin = createAdminClient();

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ext = extFromMime(file.type);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `spots/${ym}/${now.getTime()}-${rand}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    console.error('[uploadSpotImage] upload failed', uploadError);
    return { ok: false, code: 'upload_failed' };
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}
