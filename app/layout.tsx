import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Serif_JP } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSerifJp = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'hana nav';
const SITE_DESCRIPTION =
  '全国の花畑スポットを、エリア・季節・花の種類から探せる検索サービス。AI花判定で目の前の花も識別できます。';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${SITE_NAME} | 花畑スポット検索`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 花畑スポット検索`,
    description: SITE_DESCRIPTION,
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | 花畑スポット検索`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJp.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
