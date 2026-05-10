'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/utils/usernameValidator';

/**
 * プロフィールの username を更新する。
 *
 * - 認証必須。RLS により他人の profiles は UPDATE できないが、ここでも `auth.uid()` ベースで
 *   `eq('id', user.id)` を明示する（防御的多層化）。
 * - UNIQUE 制約違反（PostgreSQL コード `23505`）は username_taken にマッピング。
 * - 成功時は `revalidatePath('/mypage', 'layout')` でブックマーク・レビュー・ヘッダーアバター
 *   等のキャッシュを一括無効化（マイページ TOP のヘッダーが古い名前を見せ続けないように）。
 */
export async function updateUsername(formData: FormData) {
  const usernameInput = formData.get('username');
  const validated = validateUsername(usernameInput);

  if (!validated.ok) {
    redirect('/mypage/profile?error=invalid_username');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: validated.value })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      redirect('/mypage/profile?error=username_taken');
    }
    console.error('[mypage/profile/updateUsername] failed', error);
    redirect('/mypage/profile?error=update_failed');
  }

  revalidatePath('/mypage', 'layout');
  redirect('/mypage/profile?status=updated');
}

/**
 * アバター画像 URL を更新（クライアントの Storage アップロード後に呼ばれる）または NULL に戻す。
 * Storage 上の物理ファイル削除は MVP では行わない（古い画像が public バケットに残るが容量影響は軽微。
 * 必要になったらライフサイクルポリシー側で対応）。
 */
export async function setAvatarUrl(
  url: string | null,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (url !== null) {
    if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
      return { ok: false, code: 'invalid_input' };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: 'unauthorized' };
  }

  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);

  if (error) {
    console.error('[mypage/profile/setAvatarUrl] failed', error);
    return { ok: false, code: 'update_failed' };
  }

  revalidatePath('/mypage', 'layout');
  return { ok: true };
}
