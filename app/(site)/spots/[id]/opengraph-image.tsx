import { ImageResponse } from 'next/og';
import { COPY } from '@/lib/constants/copy';
import { loadGoogleFont } from '@/lib/og/loadFont';
import { getSpotMeta } from '@/lib/queries/spotDetail';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

export const alt = COPY.site.titleDefault;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getSpotMeta(id);

  const title = meta?.name ?? COPY.site.name;
  const subtitle = meta?.prefectureName ?? COPY.site.titleSuffix;
  const seasonText = meta ? formatSeasonRange(meta.bestSeasonStart, meta.bestSeasonEnd) : '';
  const siteName = COPY.site.name;

  const textForFont = `${title}${subtitle}${seasonText}${siteName}見頃`;
  const fontJp = await loadGoogleFont('Noto Serif JP', textForFont, 700);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 96px',
        background: 'linear-gradient(135deg, #fde7ef 0%, #ffd7e3 50%, #f6b9cf 100%)',
        color: '#3a1f2b',
        fontFamily: 'NotoSerifJP',
      }}
    >
      <div style={{ display: 'flex', fontSize: 30, opacity: 0.7, letterSpacing: 4 }}>
        {subtitle}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 96, lineHeight: 1.15, fontWeight: 700 }}>
          {title}
        </div>
        {seasonText && (
          <div style={{ display: 'flex', marginTop: 24, fontSize: 36, opacity: 0.85 }}>
            見頃 {seasonText}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: 28,
          opacity: 0.6,
          letterSpacing: 2,
        }}
      >
        {siteName}
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'NotoSerifJP', data: fontJp, style: 'normal', weight: 700 }],
    },
  );
}
