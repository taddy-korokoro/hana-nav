import { ImageResponse } from 'next/og';
import { COPY } from '@/lib/constants/copy';
import { getAreaDetail, getPrefecture } from '@/lib/queries/areas';
import { loadGoogleFont } from '@/lib/og/loadFont';

export const alt = COPY.site.titleDefault;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ prefecture_id: string }> }) {
  const { prefecture_id } = await params;
  const id = Number.parseInt(prefecture_id, 10);
  const valid = Number.isInteger(id) && id >= 1 && id <= 47;

  const prefecture = valid ? await getPrefecture(id) : null;
  const detail = valid ? await getAreaDetail(id) : null;

  const title = prefecture?.name ?? COPY.site.name;
  const region = prefecture?.region ?? '';
  const spotCount = detail?.spots.length ?? 0;
  const countText = spotCount > 0 ? `公開スポット ${spotCount}件` : '';
  const siteName = COPY.site.name;
  const eyebrow = COPY.area.eyebrow;

  const textForFont = `${title}${region}${countText}${siteName}${eyebrow}公開スポット件`;
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
        background: 'linear-gradient(135deg, #e8f4ec 0%, #fde7ef 60%, #f6b9cf 100%)',
        color: '#3a1f2b',
        fontFamily: 'NotoSerifJP',
      }}
    >
      <div style={{ display: 'flex', fontSize: 30, opacity: 0.7, letterSpacing: 4 }}>
        {eyebrow} / {region}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 128, lineHeight: 1.1, fontWeight: 700 }}>
          {title}
        </div>
        {countText && (
          <div style={{ display: 'flex', marginTop: 24, fontSize: 36, opacity: 0.85 }}>
            {countText}
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
