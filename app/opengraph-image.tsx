import { ImageResponse } from 'next/og';
import { COPY } from '@/lib/constants/copy';
import { loadGoogleFont } from '@/lib/og/loadFont';

export const alt = COPY.site.titleDefault;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const title = COPY.site.name;
  const subtitle = COPY.site.titleSuffix;
  const tagline = COPY.site.descriptionShort;

  const fontJp = await loadGoogleFont('Noto Serif JP', `${title}${subtitle}${tagline}`, 700);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 96px',
        background: 'linear-gradient(135deg, #fde7ef 0%, #ffd7e3 50%, #f6b9cf 100%)',
        color: '#3a1f2b',
        fontFamily: 'NotoSerifJP',
      }}
    >
      <div style={{ display: 'flex', fontSize: 32, opacity: 0.7, letterSpacing: 4 }}>
        {subtitle}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 144,
          lineHeight: 1.1,
          marginTop: 16,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 34,
          marginTop: 32,
          opacity: 0.85,
          maxWidth: 960,
        }}
      >
        {tagline}
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'NotoSerifJP', data: fontJp, style: 'normal', weight: 700 }],
    },
  );
}
