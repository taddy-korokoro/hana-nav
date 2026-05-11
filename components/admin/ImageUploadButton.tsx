'use client';

import { useRef, useState, useTransition } from 'react';
import { resizeImage } from '@/lib/utils/imageResize';

export type UploadActionResult =
  | { ok: true; url: string; path: string }
  | {
      ok: false;
      code: 'upload_invalid_type' | 'upload_too_large' | 'upload_failed' | 'no_file';
    };

type Props = {
  label: string;
  uploadingLabel: string;
  uploadAction: (formData: FormData) => Promise<UploadActionResult>;
  onUploaded: (url: string) => void;
  onError: (code: string) => void;
};

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 5 * 1024 * 1024;

/**
 * 画像 1 枚をアップロードする汎用 UI。owner ごとに異なる Server Action（spot 用 / flower 用）を
 * `uploadAction` props で受け取り、クライアント側のリサイズ＋送信フローはここに集約する。
 *
 * フロー:
 *   1. ファイル選択 → MIME / サイズ検証
 *   2. `resizeImage` で 1024px / JPEG 0.8 / 2MB 以下に縮小
 *   3. `uploadAction` Server Action に渡す（呼び出し先で Service Role を使って Storage に PUT）
 *   4. 公開 URL を `onUploaded` で親に通知
 */
export function ImageUploadButton({
  label,
  uploadingLabel,
  uploadAction,
  onUploaded,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!ACCEPT_TYPES.includes(file.type)) {
      onError('upload_invalid_type');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      onError('upload_too_large');
      return;
    }

    setBusy(true);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.set('file', resized);

      startTransition(async () => {
        const result = await uploadAction(formData);
        if (!result.ok) {
          onError(result.code);
        } else {
          onUploaded(result.url);
        }
        setBusy(false);
      });
    } catch (e) {
      console.error('[ImageUploadButton] failed to process file', e);
      onError('upload_failed');
      setBusy(false);
    }
  };

  const disabled = busy || pending;

  return (
    <>
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
        disabled={disabled}
        className="shrink-0 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? uploadingLabel : label}
      </button>
    </>
  );
}
