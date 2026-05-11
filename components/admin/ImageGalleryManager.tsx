'use client';

import { useState } from 'react';
import { ImageUploadButton, type UploadActionResult } from './ImageUploadButton';

export type GalleryImageInput = {
  url: string;
  caption?: string | null;
  displayOrder: number;
};

type Labels = {
  imageUrlLabel: string;
  imageCaptionLabel: string;
  addImage: string;
  removeImage: string;
  moveUp: string;
  moveDown: string;
  uploadButton: string;
  uploading: string;
  previewAlt: (i: number) => string;
  urlOrUploadHint: string;
};

type Props = {
  value: GalleryImageInput[];
  onChange: (next: GalleryImageInput[]) => void;
  uploadAction: (formData: FormData) => Promise<UploadActionResult>;
  errors: Record<string, string>;
  labels: Labels;
};

const INPUT_CLASS =
  'w-full rounded-card border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-line-strong focus:ring-2 focus:ring-brand/20';

/**
 * 画像一覧を編集する汎用コンポーネント。spot / flower の両エディタから利用される。
 *
 * - URL 直入力 もしくは アップロードボタン
 * - 並び替え（上 / 下）と削除
 * - 並び替え・削除時に `displayOrder` を 0 起点で振り直す
 *
 * 親フォーム側で `JSON.stringify(value)` を hidden input に流す前提（既存パターン踏襲）。
 */
export function ImageGalleryManager({ value, onChange, uploadAction, errors, labels }: Props) {
  const [uploadErrorKey, setUploadErrorKey] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">{labels.urlOrUploadHint}</p>
      {uploadErrorKey && (
        <p
          role="alert"
          className="rounded-card border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {errors[uploadErrorKey] ?? errors.upload_failed}
        </p>
      )}
      <div className="space-y-3">
        {value.map((img, idx) => (
          <div key={idx} className="rounded-card border border-line bg-white p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr_auto]">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-card border border-line bg-surface-2">
                {img.url ? (
                  // 任意ドメインの URL をプレビューするため next/image の remotePatterns に依存できない。
                  // 管理画面限定の小さなサムネ表示なので最適化は不要と判断し <img> を採用する。
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={labels.previewAlt(idx)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-ink-faint">no image</span>
                )}
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">
                    {labels.imageUrlLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      className={INPUT_CLASS}
                      value={img.url}
                      onChange={(e) =>
                        onChange(
                          value.map((it, i) => (i === idx ? { ...it, url: e.target.value } : it)),
                        )
                      }
                    />
                    <ImageUploadButton
                      label={labels.uploadButton}
                      uploadingLabel={labels.uploading}
                      uploadAction={uploadAction}
                      onUploaded={(url) => {
                        setUploadErrorKey(null);
                        onChange(value.map((it, i) => (i === idx ? { ...it, url } : it)));
                      }}
                      onError={(code) => setUploadErrorKey(code)}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">
                    {labels.imageCaptionLabel}
                  </span>
                  <input
                    className={INPUT_CLASS}
                    value={img.caption ?? ''}
                    onChange={(e) =>
                      onChange(
                        value.map((it, i) => (i === idx ? { ...it, caption: e.target.value } : it)),
                      )
                    }
                  />
                </label>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2 disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-white"
                  disabled={idx === 0}
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...value];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    onChange(next.map((v, i) => ({ ...v, displayOrder: i })));
                  }}
                >
                  {labels.moveUp}
                </button>
                <button
                  type="button"
                  className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2 disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-white"
                  disabled={idx === value.length - 1}
                  onClick={() => {
                    if (idx === value.length - 1) return;
                    const next = [...value];
                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                    onChange(next.map((v, i) => ({ ...v, displayOrder: i })));
                  }}
                >
                  {labels.moveDown}
                </button>
                <button
                  type="button"
                  className="rounded-pill border border-destructive/30 bg-white px-3 py-1 text-xs text-destructive transition hover:border-destructive/50 hover:bg-destructive/10"
                  onClick={() =>
                    onChange(
                      value.filter((_, i) => i !== idx).map((v, i) => ({ ...v, displayOrder: i })),
                    )
                  }
                >
                  {labels.removeImage}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong hover:bg-surface-2"
          onClick={() => onChange([...value, { url: '', caption: '', displayOrder: value.length }])}
        >
          {labels.addImage}
        </button>
        <ImageUploadButton
          label={labels.uploadButton}
          uploadingLabel={labels.uploading}
          uploadAction={uploadAction}
          onUploaded={(url) => {
            setUploadErrorKey(null);
            onChange([...value, { url, caption: '', displayOrder: value.length }]);
          }}
          onError={(code) => setUploadErrorKey(code)}
        />
      </div>
    </div>
  );
}
