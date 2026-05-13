import { COPY } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';

type Props = {
  /** 表示サイズ（縦高さ目安）。`sm` 32px / `md` 40px / `lg` 56px / `xl` 96px / `2xl` 144px */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** ロゴのバリエーション。`default` は通常ロゴ、`error` は 404 ページ用（背景に大きな "404"） */
  variant?: 'default' | 'error';
  className?: string;
};

const SIZE_PX: Record<NonNullable<Props['size']>, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
  '2xl': 144,
};

// ブランドトークンに合わせた色（globals.css の `@theme` と同期）
const COLOR_INK = '#1c1917';
const COLOR_INK_MUTED = '#78716c';
const COLOR_LINE = '#e7e5e4';
const COLOR_BRAND = '#c66487';
const COLOR_SUMMER = '#f5c84b';

const FONT_FAMILY = "var(--font-serif), 'Noto Serif JP', serif";

// `default` / `error` バリアントの viewBox 比率（width / height）。`size` で
// 指定するのは高さで、横幅はこの比率で自動計算する。
const DEFAULT_ASPECT = 1.6;
const ERROR_ASPECT = 1.7;

/**
 * サイト共通ロゴ（インライン SVG）。
 *
 * 「hana / nav」の 2 段組み明朝体ロゴに 5 弁の花マークを 1 点配置する。
 * 通常版は中央列に「ハナ ✿ ナビ」のサブカナを並べ、エラー版は背景に大きな
 * "404" を重ねる横長レイアウト。色はブランドトークン（@theme）と同期した
 * ハードコード。
 *
 * Tailwind のフォントトークン `var(--font-serif)` を使うため、`app/layout.tsx`
 * で Noto Serif JP を読み込んでいる前提。
 *
 * `size` は縦高さ（px）を表し、横幅は viewBox のアスペクト比に従って自動拡張
 * される（default は 1.6 倍、error は 1.7 倍）。
 */
export function SiteLogo({ size = 'md', variant = 'default', className }: Props) {
  const heightPx = SIZE_PX[size];
  if (variant === 'error') {
    return <SiteLogoError heightPx={heightPx} className={className} />;
  }
  return <SiteLogoDefault sizePx={heightPx} className={className} />;
}

function SiteLogoDefault({ sizePx, className }: { sizePx: number; className?: string }) {
  const widthPx = Math.round(sizePx * DEFAULT_ASPECT);
  return (
    <svg
      role="img"
      aria-label={COPY.site.name}
      width={widthPx}
      height={sizePx}
      viewBox="0 0 320 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none', className)}
    >
      {/* メインの hana / nav テキスト */}
      <g fontFamily={FONT_FAMILY} fontWeight={700} fill={COLOR_INK}>
        <text x="160" y="85" textAnchor="middle" fontSize="56">
          hana
        </text>
        <text x="160" y="185" textAnchor="middle" fontSize="56">
          nav
        </text>
      </g>
      {/* サブカナ「ハナ ✿ ナビ」 */}
      <g fontFamily={FONT_FAMILY} fill={COLOR_INK_MUTED} fontSize="12">
        <text x="100" y="120" textAnchor="middle" letterSpacing="3">
          ハナ
        </text>
        <text x="220" y="120" textAnchor="middle" letterSpacing="3">
          ナビ
        </text>
      </g>
      {/* 5 弁の花マーク */}
      <FlowerMark cx={160} cy={116} radius={11} />
    </svg>
  );
}

function SiteLogoError({ heightPx, className }: { heightPx: number; className?: string }) {
  const widthPx = Math.round(heightPx * ERROR_ASPECT);
  return (
    <svg
      role="img"
      aria-label={`404 ${COPY.site.name}`}
      width={widthPx}
      height={heightPx}
      viewBox="0 0 340 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none', className)}
    >
      {/* 背景の "404" を薄く敷く（fontSize 150 × 3 桁で約 252px 幅、両端に 44px ずつ余白） */}
      <text
        x="170"
        y="160"
        textAnchor="middle"
        fontFamily={FONT_FAMILY}
        fontWeight={700}
        fontSize="150"
        fill={COLOR_LINE}
      >
        404
      </text>
      {/* 前面の hana / nav */}
      <g fontFamily={FONT_FAMILY} fontWeight={700} fill={COLOR_INK}>
        <text x="170" y="80" textAnchor="middle" fontSize="46">
          hana
        </text>
        <text x="170" y="180" textAnchor="middle" fontSize="46">
          nav
        </text>
      </g>
      <g fontFamily={FONT_FAMILY} fill={COLOR_INK_MUTED} fontSize="11">
        <text x="125" y="118" textAnchor="middle" letterSpacing="2">
          ハナ
        </text>
        <text x="215" y="118" textAnchor="middle" letterSpacing="2">
          ナビ
        </text>
      </g>
      <FlowerMark cx={170} cy={114} radius={10} />
    </svg>
  );
}

/**
 * 5 弁の花マーク。花弁を `brand`、中心を `summer`（黄）で塗る。
 * `cx` / `cy` は viewBox 内の中心座標、`radius` は花全体の半径目安。
 */
function FlowerMark({ cx, cy, radius }: { cx: number; cy: number; radius: number }) {
  const petals = 5;
  const petalDist = radius * 0.7;
  const petalR = radius * 0.55;
  const centerR = radius * 0.32;

  return (
    <g transform={`translate(${cx} ${cy})`}>
      {Array.from({ length: petals }, (_, i) => {
        const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
        const dx = Math.cos(angle) * petalDist;
        const dy = Math.sin(angle) * petalDist;
        return <circle key={i} cx={dx} cy={dy} r={petalR} fill={COLOR_BRAND} />;
      })}
      <circle r={centerR} fill={COLOR_SUMMER} />
    </g>
  );
}
