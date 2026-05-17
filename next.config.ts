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
      // チケット 18：greensnap.jp スクレイピング由来の花マスター画像 CDN（暫定ホットリンク）。
      // ホスト名のサブドメインは greensnap 側の都合で変わり得るため、変化時は再登録する。
      // ワイルドカード（**.cloudfront.net）は CloudFront 全体を許可してしまうので使わない。
      {
        protocol: 'https' as const,
        hostname: 'dadfpmh61h9tr.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'd3pbyuzcd27kd.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
