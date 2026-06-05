import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  // 実機検証で Mac の LAN IP（http://192.168.x.x:3000 等）から dev server に
  // アクセスする際、Next.js のデフォルトの cross-origin 拒否で HMR の
  // WebSocket（_next/webpack-hmr）が「cannot parse response」で切られるため、
  // RFC1918 プライベート帯と Bonjour（*.local）を allow しておく。
  // dev のみで効くオプションなので本番ビルドには影響しない。
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '*.local'],

  // Cache Components を有効化。Server Component のデータ取得は `'use cache'` で
  // 明示的にキャッシュするか、Suspense 境界の内側で動的に取得する形を強制する。
  // page.tsx の `export const dynamic = 'force-dynamic'` / `export const revalidate`
  // とは非互換のため、ページ側はそれらを撤去済み（Step 2 / 4 で対応）。
  cacheComponents: true,

  experimental: {
    // dev で Next.js DevTools の「Instant Navs」トグルを使うためのフラグ。
    // 本番ビルドには影響しない。
    instantNavigationDevToolsToggle: true,
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      // チケット 22a：楽天アフィリエイト導入。書籍・商品・ホテルの画像 CDN。
      // 楽天側のドメイン構成は公式に変動はほぼないが、サブドメインの揺らぎがあるためそれぞれ列挙。
      // 失敗時は <Image unoptimized /> で逃げているため、ここに追加されていなくても直接 <img> 相当で表示されること。
      {
        protocol: 'https' as const,
        hostname: 'thumbnail.image.rakuten.co.jp',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'shop.r10s.jp',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'img.travel.rakuten.co.jp',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'trvimg.r10s.jp',
        pathname: '/**',
      },
    ],
    // AVIF を優先（同品質で WebP より 20-30% 小さい）。AVIF 非対応ブラウザは webp に自動 fallback。
    formats: ['image/avif', 'image/webp'],
    // 画像 1 バリアントを Netlify Image CDN がキャッシュし続ける期間。
    // Storage 上の画像は更新頻度が低い前提で 30 日にして、cold cache 率を下げる。
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
