import { ImageResponse } from 'next/og';
import { COPY } from '@/lib/constants/copy';
import { loadGoogleFont } from '@/lib/og/loadFont';
import { getFlowerMeta } from '@/lib/queries/flowers';
import { formatSeasonRange } from '@/lib/utils/seasonUtils';

export const alt = COPY.site.titleDefault;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getFlowerMeta(id);

  const title = meta?.name ?? COPY.site.name;
  const seasonText = meta ? formatSeasonRange(meta.defaultSeasonStart, meta.defaultSeasonEnd) : '';
  const spotsText = meta && meta.spotCount > 0 ? `関連スポット ${meta.spotCount}件` : '';
  const siteName = COPY.site.name;
  const eyebrow = COPY.flowersList.eyebrow;

  const textForFont = `${title}${seasonText}${spotsText}${siteName}${eyebrow}見頃 関連スポット件`;
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
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde7ef 50%, #f6b9cf 100%)',
        color: '#3a1f2b',
        fontFamily: 'NotoSerifJP',
      }}
    >
      <div style={{ display: 'flex', fontSize: 30, opacity: 0.7, letterSpacing: 4 }}>{eyebrow}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 112, lineHeight: 1.15, fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 24, fontSize: 32, opacity: 0.85 }}>
          {seasonText && <span>見頃 {seasonText}</span>}
          {spotsText && <span>{spotsText}</span>}
        </div>
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
