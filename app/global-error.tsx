'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * root layout 自体が壊れた場合の最終フォールバック。
 * layout を経由せず <html> / <body> を含む必要があるため、globals.css の
 * トークンや next/font も読み込まれない前提で、最小限の inline style だけで
 * 描画する。COPY / Link / @/components 系も使わない（layout 失敗時のため）。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global] error boundary caught', error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Sans", "Yu Gothic", sans-serif',
          background: '#fafaf9',
          color: '#1c1917',
        }}
      >
        <main
          style={{
            maxWidth: '32rem',
            margin: '0 auto',
            padding: '4rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            ページを表示できませんでした
          </h1>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#78716c' }}>
            一時的な問題が発生しました。少し時間を置いてから再度お試しください。
          </p>
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                background: '#c66487',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              もう一度試す
            </button>
            <Link
              href="/"
              style={{
                background: '#fff',
                color: '#1c1917',
                border: '1px solid #e7e5e4',
                borderRadius: '9999px',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              トップへ
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
