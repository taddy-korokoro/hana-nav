'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadSpotImage } from '@/app/admin/spots/upload-actions';
import { resizeImage } from '@/lib/utils/imageResize';

type Props = {
  label: string;
  uploadingLabel: string;
  onUploaded: (url: string) => void;
  onError: (code: string) => void;
};

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 5 * 1024 * 1024;

/**
 * 画像 1 枚をアップロードする小さな UI。
 *
 * フロー:
 *   1. ファイル選択 → MIME / サイズ検証
 *   2. `resizeImage` で 1024px / JPEG 0.8 / 2MB 以下に縮小（CLAUDE.md「コスト・セキュリティ境界」準拠）
 *   3. Server Action `uploadSpotImage` に流す（Service Role で `images` バケットに置く）
 *   4. 公開 URL を `onUploaded` で親に通知。親側で `SpotImageInput.url` にセットする想定
 */
export function SpotImageUploadButton({ label, uploadingLabel, onUploaded, onError }: Props) {
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
        const result = await uploadSpotImage(formData);
        if (!result.ok) {
          onError(result.code);
        } else {
          onUploaded(result.url);
        }
        setBusy(false);
      });
    } catch (e) {
      console.error('[SpotImageUploadButton] failed to process file', e);
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
