import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Serif_JP } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { COPY } from '@/lib/constants/copy';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 700 のみ読み込み（500 未使用）。font-semibold は 700 で代用。
const notoSerifJp = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: COPY.site.titleDefault,
    template: `%s | ${COPY.site.name}`,
  },
  description: COPY.site.description,
  applicationName: COPY.site.name,
  openGraph: {
    type: 'website',
    siteName: COPY.site.name,
    title: COPY.site.titleDefault,
    description: COPY.site.description,
    url: '/',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: COPY.site.titleDefault,
    description: COPY.site.description,
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
