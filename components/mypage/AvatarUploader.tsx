'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { setAvatarUrl } from '@/app/(site)/mypage/profile/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { COPY } from '@/lib/constants/copy';
import { createClient } from '@/lib/supabase/client';
import { resizeImage } from '@/lib/utils/imageResize';

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const STORAGE_BUCKET = 'avatars';

type Props = {
  userId: string;
  initialUrl: string | null;
  initialFallback: string;
};

/**
 * アバター画像のアップロード UI。
 *
 * 流れ：
 *   1. ローカルでファイルを選ぶ → MIME / サイズ検証
 *   2. 1024px / JPEG 0.8 にリサイズ（CLAUDE.md「コスト・セキュリティ境界」準拠）
 *   3. ブラウザの Supabase クライアントで `avatars/{userId}/avatar-{ts}.jpg` にアップロード
 *      （Storage RLS で `auth.uid()` のフォルダ配下のみ書き込み可）
 *   4. アップロード結果の public URL を Server Action `setAvatarUrl` に渡して profiles.avatar_url を更新
 *
 * Storage 上の旧ファイルは MVP では物理削除しない（specs/tech-stack.md / docs/13_mypage.md 参照）。
 * 「アバターを削除」は profiles.avatar_url を NULL に戻すのみ。
 */
export function AvatarUploader({ userId, initialUrl, initialFallback }: Props) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'removing'>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const localObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) URL.revokeObjectURL(localObjectUrlRef.current);
    };
  }, []);

  const errorMessage = errorKey ? COPY.mypage.profile.errors[errorKey] : null;

  async function handleFile(file: File) {
    setErrorKey(null);

    if (!ACCEPT_TYPES.includes(file.type)) {
      setErrorKey('avatar_invalid_type');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setErrorKey('avatar_too_large');
      return;
    }

    setBusy('uploading');

    try {
      const resized = await resizeImage(file);
      const supabase = createClient();
      const objectPath = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, resized, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[AvatarUploader] upload failed', uploadError);
        setErrorKey('avatar_upload_failed');
        setBusy('idle');
        return;
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
      const publicUrl = data.publicUrl;

      const result = await setAvatarUrl(publicUrl);
      if (!result.ok) {
        setErrorKey(result.code === 'update_failed' ? 'update_failed' : 'avatar_upload_failed');
        setBusy('idle');
        return;
      }

      // ブラウザに即時反映するためローカル ObjectURL でプレビューを更新
      if (localObjectUrlRef.current) URL.revokeObjectURL(localObjectUrlRef.current);
      const objUrl = URL.createObjectURL(resized);
      localObjectUrlRef.current = objUrl;
      setPreviewUrl(objUrl);
      setBusy('idle');
      // ヘッダーのアバターなど Server Component を再取得（setAvatarUrl 内で revalidatePath 済）。
      // window.location.reload() はフルページリロードで SPA ナビゲーションをバイパスするため使わない。
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error('[AvatarUploader] unexpected error', e);
      setErrorKey('avatar_upload_failed');
      setBusy('idle');
    }
  }

  async function handleRemove() {
    setErrorKey(null);
    setBusy('removing');
    const result = await setAvatarUrl(null);
    if (!result.ok) {
      setErrorKey('avatar_remove_failed');
      setBusy('idle');
      return;
    }
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setBusy('idle');
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">{COPY.mypage.profile.avatarLabel}</p>

      <div className="flex items-center gap-5">
        <Avatar size="lg" className="size-20">
          {previewUrl && <AvatarImage src={previewUrl} alt="" />}
          <AvatarFallback className="font-serif text-2xl">{initialFallback}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== 'idle'}
            className="inline-flex items-center justify-center rounded-pill border border-line bg-white px-4 py-2 text-xs font-medium transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'uploading'
              ? COPY.mypage.profile.avatarUploading
              : COPY.mypage.profile.avatarChange}
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy !== 'idle'}
              className="inline-flex items-center justify-center rounded-pill px-4 py-2 text-xs font-medium text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'removing'
                ? COPY.mypage.profile.avatarRemoving
                : COPY.mypage.profile.avatarClear}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-muted">{COPY.mypage.profile.avatarHint}</p>

      {errorMessage && (
        <p
          className="rounded-card bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
