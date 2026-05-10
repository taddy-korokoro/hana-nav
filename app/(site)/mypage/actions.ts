'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { COPY } from '@/lib/constants/copy';
import { createClient } from '@/lib/supabase/server';

/**
 * 退会処理（論理削除）。
 * - `profiles.deleted_at = NOW()` をセット。auth.users 自体は残す（再登録時の混乱を避ける／
 *   レビュー等で auth_users 参照が残るため、`profiles.deleted_at IS NOT NULL` を「退会済」表示に使う）。
 * - 投稿レビューは仕様（specs/database.md）に従い「退会済ユーザー」として残す。
 * - 完了後はサインアウトして `/auth/login?withdraw=ok` へリダイレクト。
 *
 * セキュリティ：必ず getUser() で現在のユーザーを再取得してから profiles を更新する。
 * UPDATE RLS は `auth.uid() = id` で守られているため、他人の論理削除はそもそもできないが、
 * ここでも明示的に user.id を where 句に入れる（防御的多層化）。
 */
export async function withdraw(formData: FormData) {
  // 同意チェックボックス（クライアントは disabled で送信を抑止しているが、JS 無効化や
  // curl 等で直接 POST した場合に同意なしの退会が成立してしまうため、サーバー側でも検証）。
  const agreed = formData.get('agreed');
  const confirmPhrase = formData.get('confirm');

  if (
    agreed !== 'on' ||
    typeof confirmPhrase !== 'string' ||
    confirmPhrase.trim() !== COPY.mypage.top.withdraw.phrase
  ) {
    redirect('/mypage?error=invalid_input');
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
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[mypage/withdraw] failed to soft-delete profile', error);
    redirect('/mypage?error=withdraw_failed');
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login?withdraw=ok');
}
