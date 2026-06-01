'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { tokyoYmd } from '@/lib/utils/dateUtils';
import { requireWriteAdmin } from '@/lib/utils/requireAdmin';

const BUCKET = 'images';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; code: 'upload_invalid_type' | 'upload_too_large' | 'upload_failed' | 'no_file' };

/**
 * 管理画面の花マスター画像アップロード Server Action。
 * パスは `flowers/YYYY-MM/{timestamp}-{rand}.{ext}` 形式。スポット用と同じ `images` バケットに
 * フラットに置き、所有者には紐付けない（編集時のキャンセル考慮）。
 *
 * クライアント側でリサイズ済み前提だが、サーバー側でも MIME / サイズ多層防御。
 */
export async function uploadFlowerImage(formData: FormData): Promise<UploadResult> {
  await requireWriteAdmin();

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

  const { year, month } = tokyoYmd();
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  const ext = extFromMime(file.type);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `flowers/${ym}/${Date.now()}-${rand}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    console.error('[uploadFlowerImage] upload failed', uploadError);
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
