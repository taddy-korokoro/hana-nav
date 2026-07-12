'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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

type CardTheme = 'asagiri' | 'tsukiyo' | 'oboro' | 'tasogare' | 'sekka';

const THEMES: Record<CardTheme, { label: string; swatch: string }> = {
  asagiri: { label: '朝霧', swatch: '#e8ddd5' },
  tsukiyo: { label: '月夜', swatch: '#1e2850' },
  oboro: { label: '朧', swatch: '#e5d8e0' },
  tasogare: { label: '黄昏', swatch: '#783c64' },
  sekka: { label: '雪華', swatch: '#dce6f5' },
};

// 明るいオーバーレイのテーマ。auto 文字色の判定に使う。
const LIGHT_THEMES: readonly CardTheme[] = ['asagiri', 'oboro', 'sekka'];

// 文字色パレット。'auto' はテーマ準拠（asagiri=ダーク、他=白）。
// 明示指定した場合はテーマに関わらず選択色を全テキストに適用する。
// hasBorder は swatch が背景（白）と同化する色に黒枠を付けるためのフラグ。
type TextColor = 'auto' | 'white' | 'cream' | 'black' | 'rose' | 'olive' | 'lavender' | 'turquoise';

const TEXT_COLORS: Record<
  TextColor,
  { label: string; swatch: string; rgb: string | null; hasBorder?: boolean }
> = {
  auto: { label: 'オート', swatch: 'linear-gradient(135deg, #ffffff 50%, #1c1917 50%)', rgb: null },
  white: { label: 'ホワイト', swatch: '#ffffff', rgb: '255,255,255', hasBorder: true },
  cream: { label: 'クリーム', swatch: '#f5edd8', rgb: '245,237,216' },
  black: { label: 'ブラック', swatch: '#1c1917', rgb: '28,25,23' },
  rose: { label: 'ローズ', swatch: '#d16a83', rgb: '209,106,131' },
  olive: { label: 'オリーブ', swatch: '#6b7333', rgb: '107,115,51' },
  lavender: { label: 'ラベンダー', swatch: '#a891b8', rgb: '168,145,184' },
  turquoise: { label: 'ターコイズ', swatch: '#4a9db8', rgb: '74,157,184' },
};

// 写真フィルタ。花写真向けに色調をチューニングした 5 種。
// 値は Canvas 2D の `ctx.filter` にそのまま渡す CSS filter 文字列。
type PhotoFilter = 'none' | 'sakura' | 'shinryoku' | 'tanga' | 'yoko';

const PHOTO_FILTERS: Record<PhotoFilter, { label: string; filter: string; swatch: string }> = {
  none: {
    label: 'そのまま',
    filter: 'none',
    swatch: 'linear-gradient(135deg, #e7e5e4, #a8a29e)',
  },
  sakura: {
    label: '桜色',
    filter: 'brightness(1.05) saturate(1.25) hue-rotate(-8deg)',
    swatch: 'linear-gradient(135deg, #fbcfe8, #f4a8b8)',
  },
  shinryoku: {
    label: '深緑',
    filter: 'contrast(1.15) saturate(1.2) hue-rotate(4deg)',
    swatch: 'linear-gradient(135deg, #86efac, #166534)',
  },
  tanga: {
    label: '淡雅',
    filter: 'brightness(1.08) contrast(0.92) saturate(0.85)',
    swatch: 'linear-gradient(135deg, #fef3c7, #fce7f3)',
  },
  yoko: {
    label: '陽光',
    filter: 'brightness(1.1) contrast(1.1) saturate(1.3) sepia(0.08)',
    swatch: 'linear-gradient(135deg, #fef08a, #fdba74)',
  },
};

// Canvas 2D の `ctx.filter` を非対応環境でも安全に扱うための検出。
// 古い Android WebView 等で undefined の可能性があるため。
function supportsCanvasFilter(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return ctx !== null && typeof ctx.filter === 'string';
}

// SNS シェアボタンを出すかの判定。「Web Share API がファイル共有に対応」+
// 「モバイル（タッチ主体）端末」の 2 条件を AND で満たす場合のみ true。
// macOS Chrome / Safari 等は canShare({files}) で true を返してしまうが、
// タッチデバイスではないため pointer: coarse で除外し、実質モバイルに限定する。
// 判定結果は変わらないためモジュールスコープで 1 回だけキャッシュする。
let cachedCanShareFiles: boolean | undefined;
function getCanShareFilesSnapshot(): boolean {
  if (cachedCanShareFiles !== undefined) return cachedCanShareFiles;
  if (
    typeof navigator === 'undefined' ||
    typeof window === 'undefined' ||
    typeof navigator.share !== 'function' ||
    typeof navigator.canShare !== 'function'
  ) {
    cachedCanShareFiles = false;
    return false;
  }
  // タッチ主体のポインタでなければ PC 相当と見なす。
  const isTouchPrimary =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  if (!isTouchPrimary) {
    cachedCanShareFiles = false;
    return false;
  }
  try {
    // canShare は File インスタンスが必要。空の PNG で機能検出のみ行う。
    const probe = new File([''], 'probe.png', { type: 'image/png' });
    cachedCanShareFiles = navigator.canShare({ files: [probe] });
  } catch {
    cachedCanShareFiles = false;
  }
  return cachedCanShareFiles;
}
// 能力は実行中に変化しないので購読は no-op。
function subscribeCanShareFiles(): () => void {
  return () => {};
}
// SSR 時は常に false（PC ブラウザ相当のフォールバック UI）でハイドレーション不整合を防ぐ。
function getCanShareFilesServerSnapshot(): boolean {
  return false;
}

// カード本文のフォント選択肢。実際の font-family 文字列は page.tsx で
// next/font/google が生成した値を fontFamilies prop で受け取る（Google Fonts CDN
// 直読みはプライバシー・パフォーマンス面で app/layout.tsx の方針と不整合のため）。
// characteristic は UI に表示する短い特徴文。
type CardFont = 'noto-sans-jp' | 'noto-serif-jp' | 'zen-kaku' | 'klee' | 'shippori';

const CARD_FONTS: Record<CardFont, { label: string; characteristic: string }> = {
  'noto-sans-jp': {
    label: 'Noto Sans JP',
    characteristic: 'シンプルで読みやすい',
  },
  'noto-serif-jp': {
    label: 'Noto Serif JP',
    characteristic: '上品でクラシック',
  },
  'zen-kaku': {
    label: 'Zen Kaku Gothic New',
    characteristic: '洗練されたモダン',
  },
  klee: {
    label: 'Klee One',
    characteristic: 'やさしく温かい',
  },
  shippori: {
    label: 'Shippori Mincho',
    characteristic: '落ち着いた和の趣',
  },
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

type StoryCardGeneratorProps = {
  // 各 CardFont の実際の CSS font-family 文字列。page.tsx で next/font/google が
  // 生成した値（例: '"__Noto_Sans_JP_abc", ...'）をそのまま受け取り、
  // Canvas 描画とフォント選択 UI の見本表示に用いる。
  fontFamilies: Record<CardFont, string>;
};

export function StoryCardGenerator({ fontFamilies }: StoryCardGeneratorProps) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Web Share API がファイル共有に対応しているか。非対応環境ではボタンラベルを
  // 「画像を保存」に切り替え、実挙動（ダウンロードへのフォールバック）と一致させる。
  const canShareFiles = useSyncExternalStore(
    subscribeCanShareFiles,
    getCanShareFilesSnapshot,
    getCanShareFilesServerSnapshot,
  );

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
  const [theme, setTheme] = useState<CardTheme>('tsukiyo');
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('none');
  const [cardFont, setCardFont] = useState<CardFont>('noto-sans-jp');
  const [textColor, setTextColor] = useState<TextColor>('auto');

  const flowerName = flowerNameOverride ?? defaultFlowerName;
  const flowerLanguage = flowerLanguageOverride ?? aiResult?.flower_language ?? '';
  const spotName = spotNameOverride ?? recommendedSpot?.name ?? '';

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorKey, setErrorKey] = useState<keyof typeof COPY.identify.storyCard.errors | null>(
    null,
  );

  // モバイルで本体プレビューが画面外に出たかを追跡。
  // 出た時だけ右上に浮かぶミニプレビュー（サムネイル）を表示する。
  const mainPreviewRef = useRef<HTMLDivElement>(null);
  const [showMiniPreview, setShowMiniPreview] = useState(false);

  // Blob URL のリーク防止。生成し直し or アンマウント時に古い URL を破棄する。
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  // 本体プレビューを IntersectionObserver で監視。可視面積が閾値を下回ったら
  // showMiniPreview を true に。以下 2 点に注意:
  // 1. hasStoryData（storage が揃った後の本体 JSX 描画）を deps に含める。
  //    含めないと noData JSX 段階で useEffect が走り、その時 ref は null で終了、
  //    本体 JSX に切り替わっても再実行されず observer が付かないため。
  // 2. threshold: 0（完全に画面外）だと本体プレビューが画面より縦長なため
  //    700px 以上スクロールしないと切り替わらない。intersectionRatio < 0.3 で
  //    「可視面積が 30% を切ったら」に緩めて、フォームに到達する前に切替。
  const hasStoryData = !!(storage.result && storage.userImage);
  useEffect(() => {
    if (!hasStoryData) return;
    const target = mainPreviewRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMiniPreview(entry.intersectionRatio < 0.3);
      },
      { threshold: [0, 0.3, 0.7, 1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasStoryData]);

  const scrollToMainPreview = () => {
    // scrollIntoView + scroll-mt-* に委譲。ブラウザが要素の上端を viewport 内に
    // 収まるよう自動計算するので、絶対座標を JS で計算するより堅牢。
    // preview 要素側の scroll-mt-22 が上部余白 88px を確保する。
    mainPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerate = useCallback(async () => {
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

      // Google Fonts がロードされるのを待ってから描画。document.fonts.ready は
      // 全ての pending font load を待つため、テキスト描画前に呼んでおけば選択した
      // フォントが確実に反映される（未ロード時は sans-serif フォールバック）。
      const fontFamily = fontFamilies[cardFont];
      if (typeof document !== 'undefined' && document.fonts) {
        try {
          await document.fonts.load(`bold ${Math.round(72 * (width / FULL_W))}px ${fontFamily}`);
          await document.fonts.load(`${Math.round(32 * (width / FULL_W))}px ${fontFamily}`);
          await document.fonts.ready;
        } catch {
          // フォントロード失敗はフォールバックに任せる。
        }
      }

      // 写真フィルタ適用。ctx.filter は以降の描画すべてに影響するため、
      // 画像描画の直後に 'none' に戻してオーバーレイ・テキストを非影響にする。
      // ctx.filter 非対応環境（古い Android WebView 等）は無加工にフォールバック。
      const filterCss = PHOTO_FILTERS[photoFilter].filter;
      if (filterCss !== 'none' && supportsCanvasFilter()) {
        ctx.filter = filterCss;
      }
      drawImageCover(ctx, img, 0, 0, width, height);
      if (supportsCanvasFilter()) {
        ctx.filter = 'none';
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const px = (n: number) => Math.round(n * scale);

      // テキスト領域は下部 1/4（y >= 1440）に集約する。画像を主役として大きく見せる。
      // テーマ別のオーバーレイ描画
      if (theme === 'asagiri') {
        // 下部 30% に向けたグラデーション（透明 → 白 92%）。明るい朝の空気感。
        const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.92)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
      } else if (theme === 'tsukiyo') {
        // 月夜：深い藍のグラデーション（静謐な夜空）
        const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
        gradient.addColorStop(0, 'rgba(30,40,80,0)');
        gradient.addColorStop(1, 'rgba(30,40,80,0.82)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
      } else if (theme === 'oboro') {
        // 朧：淡いピンク白のグラデーション（かすんだ朧月）
        const gradient = ctx.createLinearGradient(0, height * 0.65, 0, height);
        gradient.addColorStop(0, 'rgba(245,235,240,0)');
        gradient.addColorStop(1, 'rgba(245,235,240,0.92)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.65, width, height * 0.35);
      } else if (theme === 'tasogare') {
        // 黄昏：紫〜橙のグラデーション（夕暮れの空）
        const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
        gradient.addColorStop(0, 'rgba(140,70,90,0)');
        gradient.addColorStop(0.5, 'rgba(120,60,100,0.55)');
        gradient.addColorStop(1, 'rgba(80,40,80,0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
      } else if (theme === 'sekka') {
        // 雪華：冷たい青白のグラデーション（雪の朝）
        const gradient = ctx.createLinearGradient(0, height * 0.65, 0, height);
        gradient.addColorStop(0, 'rgba(220,230,245,0)');
        gradient.addColorStop(1, 'rgba(220,230,245,0.92)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.65, width, height * 0.35);
      }

      // テキストカラー：ユーザー指定があればそれを、'auto' の場合はテーマから決める。
      // 明るいオーバーレイのテーマ（LIGHT_THEMES）ではダーク、それ以外は白がデフォルト。
      // 全要素で同じ RGB を使い、要素ごとに alpha だけ変えて視覚階層を付ける。
      const textColorRgb =
        TEXT_COLORS[textColor].rgb ?? (LIGHT_THEMES.includes(theme) ? '28,25,23' : '255,255,255');
      const ink = (alpha: number) => `rgba(${textColorRgb},${alpha})`;

      // レイアウトは下部 25%（y=1440〜1920）に収める。任意項目の有無で内容の
      // 縦の総量が変わるので、欠けた分の半分だけ開始位置を下げて、上下の余白が
      // ざっくり均等になるようにする（垂直中央寄せ）。未設定項目の空白は挟まない。

      // 各要素の baseline gap（次の要素までの間隔）
      const NAME_GAP = 70;
      const LANG_GAP = 65;
      const META_GAP = 65;
      // コメント最大 3 行 × 行間 48px = 96px（最終行の baseline との差分）
      const COMMENT_LAST_OFFSET = 96;

      // 全項目が揃っている時と比べて省ける垂直スペース
      let savedSpace = 0;
      if (!flowerLanguage) savedSpace += LANG_GAP;
      if (!comment) savedSpace += META_GAP + COMMENT_LAST_OFFSET;

      let currentBaseline = 1520 + Math.round(savedSpace / 2);

      // 花名（常に描画・サイズは既存維持）
      ctx.fillStyle = ink(1.0);
      ctx.font = `bold ${px(72)}px ${fontFamily}`;
      ctx.fillText(flowerName || '名前のない花', width / 2, px(currentBaseline));
      currentBaseline += NAME_GAP;

      // 花言葉（任意）
      if (flowerLanguage) {
        ctx.font = `italic ${px(40)}px ${fontFamily}`;
        ctx.fillStyle = ink(0.92);
        ctx.fillText(`〜 ${flowerLanguage} 〜`, width / 2, px(currentBaseline));
        currentBaseline += LANG_GAP;
      }

      // スポット名 + 訪問日を 1 行にまとめて表示（訪問日は常に必須なので常時描画）。
      // スポット名が空の時は日付のみ。区切りは全角スペース 1 個で自然な間隔にする。
      ctx.font = `${px(40)}px ${fontFamily}`;
      ctx.fillStyle = ink(0.85);
      const dateStr = formatDate(visitedDate);
      const metaLine = spotName ? `@ ${spotName}　${dateStr}` : dateStr;
      ctx.fillText(metaLine, width / 2, px(currentBaseline));
      currentBaseline += META_GAP;

      // コメント（任意・自動改行・最大 3 行で `…` 切り詰め）
      if (comment) {
        ctx.font = `${px(38)}px ${fontFamily}`;
        ctx.fillStyle = ink(0.9);
        wrapText(ctx, comment, width / 2, px(currentBaseline), width - px(160), px(48), 3);
      }

      // ロゴ（右下）
      ctx.font = `bold ${px(32)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = ink(0.75);
      ctx.fillText('🌸 hana nav', width - px(50), height - px(40));

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
  }, [
    storage.userImage,
    flowerName,
    flowerLanguage,
    spotName,
    visitedDate,
    comment,
    theme,
    photoFilter,
    cardFont,
    textColor,
    fontFamilies,
  ]);

  // ライブプレビュー：フォーム値またはテーマが変わったら自動再生成。
  // 初回（isFirstRef = true）は即時生成、以降は 600ms デバウンス。
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRef = useRef(true);
  useEffect(() => {
    if (!storage.userImage) return;

    const delay = isFirstRef.current ? 0 : 600;
    isFirstRef.current = false;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void handleGenerate();
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleGenerate, storage.userImage]);

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
    <>
      {/* ミニプレビュー：モバイルで本体プレビューが画面外に出た時だけ右上に浮かぶ。
          サムネイル 96×170px。タップで本体プレビュー位置にスムーススクロールで戻る。
          fade + slide でフォーム操作の邪魔にならない演出。 */}
      {downloadUrl && (
        <button
          type="button"
          onClick={scrollToMainPreview}
          aria-label={sc.miniPreviewAria}
          aria-hidden={!showMiniPreview}
          className={`fixed right-3 top-3 z-30 aspect-[9/16] w-24 overflow-hidden rounded-card border border-line bg-surface-2 shadow-xl transition-all duration-300 md:hidden ${
            showMiniPreview
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-2 opacity-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={downloadUrl} alt="" className="size-full object-cover" />
        </button>
      )}

      {/* モバイルは flex-col、デスクトップは 2 カラム grid。
          grid の単一セルだと sticky の containing block がセルに閉じてしまい
          スクロール時に固定できないため、モバイルは flex-col にする。 */}
      <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-8">
        {/* フォーム：モバイルはプレビューの下、デスクトップは左カラム */}
        <div className="order-2 space-y-5 rounded-card-lg border border-line bg-white p-6 md:order-1">
          {/* テーマセレクター */}
          <fieldset>
            <legend className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
              テーマ
            </legend>
            <div className="flex flex-wrap gap-4">
              {(Object.entries(THEMES) as [CardTheme, (typeof THEMES)[CardTheme]][]).map(
                ([id, { label, swatch }]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`flex w-20 flex-col items-center gap-1.5 transition-opacity ${
                      theme === id ? 'opacity-100' : 'opacity-35 hover:opacity-65'
                    }`}
                  >
                    <span
                      className={`block size-8 rounded-full shadow-sm ring-2 ring-offset-2 transition-all ${
                        theme === id ? 'ring-brand' : 'ring-transparent'
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                    <span className="text-xs text-ink-muted">{label}</span>
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {/* 文字色 */}
          <fieldset>
            <legend className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
              文字色
            </legend>
            <div className="flex flex-wrap gap-4">
              {(Object.entries(TEXT_COLORS) as [TextColor, (typeof TEXT_COLORS)[TextColor]][]).map(
                ([id, { label, swatch, hasBorder }]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTextColor(id)}
                    className={`flex w-20 flex-col items-center gap-1.5 transition-opacity ${
                      textColor === id ? 'opacity-100' : 'opacity-35 hover:opacity-65'
                    }`}
                  >
                    <span
                      className={`block size-8 rounded-full shadow-sm ring-2 ring-offset-2 transition-all ${
                        textColor === id ? 'ring-brand' : 'ring-transparent'
                      } ${hasBorder ? 'border border-ink/70' : ''}`}
                      style={{ background: swatch }}
                    />
                    <span className="text-xs text-ink-muted">{label}</span>
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {/* 写真フィルタ */}
          <fieldset>
            <legend className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
              写真フィルタ
            </legend>
            <div className="flex flex-wrap gap-4">
              {(
                Object.entries(PHOTO_FILTERS) as [
                  PhotoFilter,
                  (typeof PHOTO_FILTERS)[PhotoFilter],
                ][]
              ).map(([id, { label, swatch }]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPhotoFilter(id)}
                  className={`flex w-20 flex-col items-center gap-1.5 transition-opacity ${
                    photoFilter === id ? 'opacity-100' : 'opacity-35 hover:opacity-65'
                  }`}
                >
                  <span
                    className={`block size-8 rounded-full shadow-sm ring-2 ring-offset-2 transition-all ${
                      photoFilter === id ? 'ring-brand' : 'ring-transparent'
                    }`}
                    style={{ background: swatch }}
                  />
                  <span className="text-xs text-ink-muted">{label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* フォント */}
          <fieldset>
            <legend className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
              フォント
            </legend>
            <div className="flex flex-col gap-2">
              {(Object.entries(CARD_FONTS) as [CardFont, (typeof CARD_FONTS)[CardFont]][]).map(
                ([id, { label, characteristic }]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCardFont(id)}
                    aria-pressed={cardFont === id}
                    className={`flex items-center gap-3 rounded-card border px-3 py-2.5 text-left transition-colors ${
                      cardFont === id
                        ? 'border-brand bg-brand-soft/30'
                        : 'border-line bg-white hover:border-line-strong'
                    }`}
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-base font-medium text-ink"
                      style={{ fontFamily: fontFamilies[id] }}
                    >
                      {label}
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">{characteristic}</span>
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <hr className="border-line" />

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

          <div className="flex items-center gap-3 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link href="/identify/result">{sc.backToResult}</Link>
            </Button>
            <p className="text-xs text-ink-faint">{sc.perfHint}</p>
          </div>

          {errorKey && <FormBanner variant="error">{sc.errors[errorKey]}</FormBanner>}

          {/* SNS シェア / 画像保存：フォームの末尾に配置。
            - モバイル（Web Share API 対応）: [SNS にシェア] + [画像を保存] の 2 ボタン
            - PC（非対応）: シェアボタンは「画像を保存」ラベルに切り替わり、
              保存ボタンは重複するので非表示。実質 1 ボタン構成にする。 */}
          {downloadUrl && (
            <div className="flex flex-wrap gap-3 border-t border-line pt-5">
              <Button type="button" onClick={handleShare} disabled={isGenerating}>
                {canShareFiles ? sc.share : sc.shareFallback}
              </Button>
              {canShareFiles && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={isGenerating}
                >
                  {sc.download}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* プレビュー：モバイルは上・幅いっぱい（通常フロー）、デスクトップは右カラム。
          両画面とも sticky は使わず、フォームと同じグリッドセル TOP から自然に
          スクロールする。これで左のフォーム先頭と右のプレビュー先頭の横軸が
          常に揃う。md:self-start はグリッドセル内でプレビューが縦に伸びないよう
          明示的に上端寄せ。モバイルはミニプレビュー（下記 fixed 要素）が
          フォーム操作時のリファレンスを担う。 */}
        <div className="order-1 md:order-2 md:sticky md:top-20 md:self-start">
          <div
            ref={mainPreviewRef}
            // scroll-mt-22: scrollIntoView 時に preview 上部 88px の余白を確保。
            // 実機で iOS Safari のアドレスバー展開時にも上端切れが起きない値として
            // この値に設定している（24px / 40px では被るケースがあったため）。
            // md: 以降は sticky が位置を管理するので scroll-mt は 0 にリセット。
            className="relative aspect-[9/16] w-full scroll-mt-22 overflow-hidden rounded-card-lg border border-line bg-surface-2 md:mx-auto md:max-w-sm md:scroll-mt-0"
          >
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

            {/* 再生成中のオーバーレイ。既存プレビューを見せたまま更新中を伝える。 */}
            {isGenerating && downloadUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                <Spinner size="md" className="text-brand" label={null} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
