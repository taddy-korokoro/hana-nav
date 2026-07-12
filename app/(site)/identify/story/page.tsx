import type { Metadata } from 'next';
import {
  Klee_One,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Shippori_Mincho,
  Zen_Kaku_Gothic_New,
} from 'next/font/google';
import { StoryCardGenerator } from '@/components/identify/StoryCardGenerator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';

// しおりカードの Canvas 描画に使うフォント一式。next/font/google 経由で自己ホスト化し、
// クライアント IP を Google Fonts CDN に渡さない・全ページに配信しない
// （このページを開いた時だけロード）方針に統一する。
// 各 variable は下記 wrapper div の className に付与され、CSS 変数として供給される。
// Canvas は `style.fontFamily` の実 family 名を受け取って `ctx.font` に渡す。
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-story-noto-sans-jp',
  display: 'swap',
});
const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-story-noto-serif-jp',
  display: 'swap',
});
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-story-zen-kaku',
  display: 'swap',
});
const kleeOne = Klee_One({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-story-klee',
  display: 'swap',
});
const shipporiMincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-story-shippori',
  display: 'swap',
});

const storyFontFamilies = {
  'noto-sans-jp': notoSansJP.style.fontFamily,
  'noto-serif-jp': notoSerifJP.style.fontFamily,
  'zen-kaku': zenKakuGothicNew.style.fontFamily,
  klee: kleeOne.style.fontFamily,
  shippori: shipporiMincho.style.fontFamily,
} as const;

// StoryCardGenerator は sessionStorage を読む Client Component。Server 側は静的シェルだが、
// 共通レイアウトの cookies 読みを許容するため disableValidation を付ける。
export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

export const metadata: Metadata = {
  title: COPY.identify.storyCard.metaTitle,
  // ユーザー写真と判定結果は sessionStorage 経由のクライアント状態のためクロールさせない。
  robots: { index: false, follow: false },
};

export default function IdentifyStoryPage() {
  const fontVariables = [
    notoSansJP.variable,
    notoSerifJP.variable,
    zenKakuGothicNew.variable,
    kleeOne.variable,
    shipporiMincho.variable,
  ].join(' ');

  return (
    <div className={`mx-auto max-w-6xl px-6 pb-24 ${fontVariables}`}>
      <section className="pb-6 pt-12 md:pt-16">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.nav.labels.identify, href: '/identify' },
            { label: COPY.identify.result.title, href: '/identify/result' },
            { label: COPY.identify.storyCard.title },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.identify.storyCard.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {COPY.identify.storyCard.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          {COPY.identify.storyCard.description}
        </p>
      </section>

      <StoryCardGenerator fontFamilies={storyFontFamilies} />
    </div>
  );
}
