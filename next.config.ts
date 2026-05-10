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
      // チケット 11：花マスターの代表画像（暫定的に外部ホットリンク）。
      // 本来は Supabase Storage に再アップして上の supabase 設定で済ませたい。
      {
        protocol: 'https' as const,
        hostname: 'hanamap.com',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
