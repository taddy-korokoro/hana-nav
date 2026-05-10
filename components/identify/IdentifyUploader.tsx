'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/constants/copy';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { resizeImage } from '@/lib/utils/imageResize';
import { RateLimitBanner } from './RateLimitBanner';
import { IDENTIFY_RESULT_STORAGE_KEY } from './storage';

type RateLimitState = {
  authenticated: boolean;
  used: number;
  limit: number;
  remaining: number;
};

const ERROR_KEY_BY_API: Record<string, keyof typeof COPY.identify.error> = {
  ai_response_parse_failed: 'parse',
  image_too_large: 'tooLarge',
  gemini_api_key_missing: 'missingKey',
  anon_id_required: 'anonRequired',
};

export function IdentifyUploader() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<keyof typeof COPY.identify.error | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const anonId = getAnonymousId();
        const res = await fetch(`/api/ai/identify-flower?anonId=${encodeURIComponent(anonId)}`);
        if (!res.ok) return;
        const json = (await res.json()) as RateLimitState;
        if (!cancelled) setRateLimit(json);
      } catch {
        // バナーが出ないだけなので握りつぶす
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorKey(null);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setErrorKey(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile || submitting) return;
    setSubmitting(true);
    setErrorKey(null);

    try {
      const anonId = getAnonymousId();
      const resized = await resizeImage(selectedFile);

      // 同一画像 24h キャッシュ（チケット 11 の optional 項目）を実装する際に
      // FormData へ `imageHash = await hashImage(resized)` を追加する。
      // 現状はサーバー側で読まれていないため計算コストだけが乗るので送らない。
      const formData = new FormData();
      formData.append('image', resized);
      formData.append('anonId', anonId);

      const res = await fetch('/api/ai/identify-flower', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          // レート制限。バナーを更新して結果は出さない。
          setRateLimit((prev) =>
            prev
              ? { ...prev, remaining: 0, used: prev.limit, limit: json.limit ?? prev.limit }
              : prev,
          );
          setSubmitting(false);
          return;
        }
        const errKey = ERROR_KEY_BY_API[json?.error] ?? 'generic';
        setErrorKey(errKey);
        setSubmitting(false);
        return;
      }

      // 結果はクライアントの sessionStorage を介して result ページに渡す。
      // URL クエリだと長すぎ / 画像 URL が露出するため避ける。
      window.sessionStorage.setItem(IDENTIFY_RESULT_STORAGE_KEY, JSON.stringify(json));
      if (json.rate_limit) {
        setRateLimit((prev) =>
          prev
            ? {
                ...prev,
                used: json.rate_limit.used,
                limit: json.rate_limit.limit,
                remaining: json.rate_limit.remaining,
              }
            : prev,
        );
      }
      router.push('/identify/result');
    } catch (error) {
      console.error('[IdentifyUploader] failed', error);
      setErrorKey('generic');
      setSubmitting(false);
    }
  };

  const reached = rateLimit ? rateLimit.remaining <= 0 && rateLimit.limit > 0 : false;

  return (
    <div className="space-y-6">
      {rateLimit && <RateLimitBanner {...rateLimit} />}

      <div className="rounded-card-lg border border-line bg-white p-6">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-card bg-surface-2">
              {/* next/image だと object URL をうまく扱えないため img で表示 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={COPY.identify.upload.preview}
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || reached}
                className="min-w-40"
              >
                {submitting ? COPY.identify.upload.submitting : COPY.identify.upload.submit}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} disabled={submitting}>
                {COPY.identify.upload.retake}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="cursor-pointer">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <span className="flex h-32 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-ink">
                <span className="text-2xl">📸</span>
                {COPY.identify.upload.camera}
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <span className="flex h-32 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface-2 text-sm font-medium text-ink-muted transition hover:border-brand hover:text-ink">
                <span className="text-2xl">🖼️</span>
                {COPY.identify.upload.pickFile}
              </span>
            </label>
          </div>
        )}

        <p className="mt-4 text-xs text-ink-faint">{COPY.identify.upload.tips}</p>

        {errorKey && (
          <div className="mt-4 rounded-card border border-rose-200 bg-rose-50 p-4 text-sm">
            <p className="font-medium text-ink">{COPY.identify.error.genericTitle}</p>
            <p className="mt-1 text-ink-muted">{COPY.identify.error[errorKey]}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-faint">{COPY.identify.privacy}</p>
    </div>
  );
}
