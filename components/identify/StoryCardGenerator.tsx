'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { FormBanner } from '@/components/ui/form-banner';
import { Spinner } from '@/components/ui/spinner';
import { COPY } from '@/lib/constants/copy';
import { drawImageCover, loadImage, wrapText } from '@/lib/utils/canvasHelpers';
import {
  IDENTIFY_RESULT_STORAGE_KEY,
  IDENTIFY_USER_IMAGE_STORAGE_KEY,
  type IdentifyApiResult,
} from './storage';

type StorageState = {
  result: IdentifyApiResult | null;
  userImage: string | null;
};

const COMMENT_MAX = 200;

// ストーリーカード固定値。`docs/specs/story-card.md` の数値に揃える。
const FULL_W = 1080;
const FULL_H = 1920;
const LITE_W = 720;
const LITE_H = 1280;

// 端末性能ヒント。CPU コア数 < 4 を「弱い」と見なして 720 で描く。
function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  return cores < 4;
}

// sessionStorage の同期。useState + useEffect だと React 19 で警告が出るため
// useSyncExternalStore を使う（IdentifyResult.tsx と同じパターン）。
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): string | null {
  const result = window.sessionStorage.getItem(IDENTIFY_RESULT_STORAGE_KEY);
  const userImage = window.sessionStorage.getItem(IDENTIFY_USER_IMAGE_STORAGE_KEY);
  // useSyncExternalStore は不変参照を要求するため文字列に畳んで返す。
  return JSON.stringify({ result, userImage });
}

function getServerSnapshot(): string | null {
  return null;
}

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(iso: string): string {
  // ISO `YYYY-MM-DD` を `YYYY.MM.DD` に整形。Locale 依存を避ける。
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return iso.replaceAll('-', '.');
}

export function StoryCardGenerator() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const storage = useMemo<StorageState>(() => {
    if (!raw) return { result: null, userImage: null };
    try {
      const parsed = JSON.parse(raw) as { result: string | null; userImage: string | null };
      const result = parsed.result ? (JSON.parse(parsed.result) as IdentifyApiResult) : null;
      return { result, userImage: parsed.userImage };
    } catch {
      return { result: null, userImage: null };
    }
  }, [raw]);

  const aiResult = storage.result?.ai_result;
  const flowerMaster = storage.result?.flower_master ?? null;
  const recommendedSpot = storage.result?.recommended_spots[0] ?? null;
  const defaultFlowerName =
    aiResult?.flower_variety || flowerMaster?.name || aiResult?.flower_name || '';

  // フォーム値は「ユーザーが手で編集したか」を null/string で表現する override パターン。
  // sessionStorage は SSR 時に読めず useEffect でセットすると React 19 の
  // `react-hooks/set-state-in-effect` に引っ掛かるため、デフォルト値は派生で計算する。
  const [flowerNameOverride, setFlowerNameOverride] = useState<string | null>(null);
  const [flowerLanguageOverride, setFlowerLanguageOverride] = useState<string | null>(null);
  const [spotNameOverride, setSpotNameOverride] = useState<string | null>(null);
  const [visitedDate, setVisitedDate] = useState<string>(todayIso());
  const [comment, setComment] = useState('');

  const flowerName = flowerNameOverride ?? defaultFlowerName;
  const flowerLanguage = flowerLanguageOverride ?? aiResult?.flower_language ?? '';
  const spotName = spotNameOverride ?? recommendedSpot?.name ?? '';

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorKey, setErrorKey] = useState<keyof typeof COPY.identify.storyCard.errors | null>(
    null,
  );

  // Blob URL のリーク防止。生成し直し or アンマウント時に古い URL を破棄する。
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleGenerate = async () => {
    if (!storage.userImage) {
      setErrorKey('imageLoad');
      return;
    }
    setIsGenerating(true);
    setErrorKey(null);

    try {
      const lite = isLowEndDevice();
      const width = lite ? LITE_W : FULL_W;
      const height = lite ? LITE_H : FULL_H;
      const scale = width / FULL_W;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      const img = await loadImage(storage.userImage);
      drawImageCover(ctx, img, 0, 0, width, height);

      // 下部グラデーション（透明 → 黒 70%）。テキストの可読性を担保する。
      const gradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height * 0.5, width, height * 0.5);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // レイアウトは下部 50% グラデーション領域（y >= 960）に収める。
      // ロゴ（y=1860）とコメント末尾が重ならないよう、コメントは最大 4 行に
      // 制限し、それ以外の要素は上に詰める。
      const px = (n: number) => Math.round(n * scale);

      // 花名
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${px(96)}px "Noto Sans JP", sans-serif`;
      ctx.fillText(flowerName || '名前のない花', width / 2, px(1280));

      // 花言葉
      if (flowerLanguage) {
        ctx.font = `italic ${px(42)}px "Noto Sans JP", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText(`〜 ${flowerLanguage} 〜`, width / 2, px(1370));
      }

      // スポット名
      if (spotName) {
        ctx.font = `${px(48)}px "Noto Sans JP", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(`@ ${spotName}`, width / 2, px(1450));
      }

      // 訪問日
      ctx.font = `${px(36)}px "Noto Sans JP", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(formatDate(visitedDate), width / 2, px(1520));

      // コメント（自動改行・最大 4 行で `…` 切り詰め）
      if (comment) {
        ctx.font = `${px(36)}px "Noto Sans JP", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        wrapText(ctx, `"${comment}"`, width / 2, px(1610), width - px(160), px(50), 4);
      }

      // ロゴ（右下）
      ctx.font = `bold ${px(32)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('🌸 hana nav', width - px(60), height - px(60));

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) throw new Error('Canvas toBlob returned null');

      // 古い URL があれば破棄してから差し替える。useEffect のクリーンアップは
      // アンマウント時にしか走らないので、ここでも明示的に解放する。
      setDownloadUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      console.error('[StoryCardGenerator] generate failed', err);
      setErrorKey('generic');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!downloadUrl) return;
    try {
      const blob = await fetch(downloadUrl).then((r) => r.blob());
      const file = new File([blob], 'hananav-story.png', { type: 'image/png' });

      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: COPY.identify.storyCard.shareTitle,
          text: COPY.identify.storyCard.shareText(flowerName || '花'),
        });
        return;
      }
      // フォールバック：ダウンロード（PC ブラウザや SDK 非対応端末）
      triggerDownload(downloadUrl);
    } catch (err) {
      // ユーザーがシェアシートをキャンセルした場合は AbortError が来る。沈黙でよい。
      if ((err as DOMException)?.name === 'AbortError') return;
      console.error('[StoryCardGenerator] share failed', err);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    triggerDownload(downloadUrl);
  };

  if (!storage.result || !storage.userImage) {
    return (
      <div className="rounded-card-lg border border-line bg-white p-10 text-center">
        <p className="font-serif text-lg font-bold">{COPY.identify.storyCard.noData.title}</p>
        <p className="mt-2 text-sm text-ink-muted">{COPY.identify.storyCard.noData.description}</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/identify">{COPY.identify.storyCard.noData.cta}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sc = COPY.identify.storyCard;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleGenerate();
        }}
        className="space-y-5 rounded-card-lg border border-line bg-white p-6"
      >
        <Field label={sc.form.flowerLabel}>
          <input
            type="text"
            value={flowerName}
            onChange={(e) => setFlowerNameOverride(e.target.value)}
            placeholder={sc.form.flowerPlaceholder}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-line-strong"
            maxLength={40}
          />
        </Field>
        <Field label={sc.form.flowerLanguageLabel}>
          <input
            type="text"
            value={flowerLanguage}
            onChange={(e) => setFlowerLanguageOverride(e.target.value)}
            placeholder={sc.form.flowerLanguagePlaceholder}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-line-strong"
            maxLength={40}
          />
        </Field>
        <Field label={sc.form.spotLabel}>
          <input
            type="text"
            value={spotName}
            onChange={(e) => setSpotNameOverride(e.target.value)}
            placeholder={sc.form.spotPlaceholder}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-line-strong"
            maxLength={40}
          />
        </Field>
        <Field label={sc.form.visitedLabel}>
          <input
            type="date"
            value={visitedDate}
            onChange={(e) => setVisitedDate(e.target.value)}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-line-strong"
          />
        </Field>
        <Field label={sc.form.commentLabel}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
            placeholder={sc.form.commentPlaceholder}
            className="min-h-24 w-full resize-y rounded-card border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-line-strong"
            maxLength={COMMENT_MAX}
          />
          <p className="mt-1 text-right text-xs text-ink-faint">
            {sc.form.commentCounter(comment.length, COMMENT_MAX)}
          </p>
        </Field>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            loading={isGenerating}
            loadingText={sc.generating}
            className="min-w-40"
          >
            {downloadUrl ? sc.regenerate : sc.generate}
          </Button>
          <Button asChild variant="outline">
            <Link href="/identify/result">{sc.backToResult}</Link>
          </Button>
        </div>

        <p className="text-xs text-ink-faint">{sc.perfHint}</p>

        {errorKey && <FormBanner variant="error">{sc.errors[errorKey]}</FormBanner>}
      </form>

      <div className="space-y-4">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-card-lg border border-line bg-surface-2">
          {downloadUrl ? (
            // next/image は object URL を扱えないため img 直書き。
            // eslint-disable-next-line @next/next/no-img-element
            <img src={downloadUrl} alt={sc.previewAlt} className="size-full object-cover" />
          ) : isGenerating ? (
            <div className="flex size-full flex-col items-center justify-center gap-3 text-sm text-ink-muted">
              <Spinner size="lg" className="text-brand" label={null} />
              <span>{sc.generating}</span>
            </div>
          ) : (
            <div className="flex size-full items-center justify-center px-6 text-center text-sm text-ink-muted">
              {sc.previewPlaceholder}
            </div>
          )}
        </div>

        {downloadUrl && (
          <div className="flex flex-wrap gap-3">
            {/* navigator.share 非対応端末では handleShare 内でダウンロードに自動フォールバック */}
            <Button type="button" onClick={handleShare}>
              {sc.share}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload}>
              {sc.download}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function triggerDownload(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hananav-story.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
