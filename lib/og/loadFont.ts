/**
 * Google Fonts の CSS を fetch して TTF/OTF バイナリだけを取り出す。
 * ImageResponse（satori）はランタイムで font バイナリを必要とするので、
 * `text` パラメータで必要なグリフだけを絞って軽量化する。
 *
 * 呼び出し側は ISR / 静的最適化されるため、ここで毎回 fetch しても
 * 実運用上はクローラー初回アクセス時のみのコストになる。
 */
export async function loadGoogleFont(
  family: string,
  text: string,
  weight: 400 | 700 = 700,
): Promise<ArrayBuffer> {
  // CSS2 エンドポイントは UA に関わらず WOFF/WOFF2 を返してしまい satori が読めない。
  // CSS1 エンドポイントに `format=truetype` を付けると TTF を直接返してくれる。
  const url = `https://fonts.googleapis.com/css?family=${encodeURIComponent(
    family,
  )}:${weight}&text=${encodeURIComponent(text)}&format=truetype`;

  const cssRes = await fetch(url, { cache: 'force-cache' });
  if (!cssRes.ok) {
    throw new Error(`[loadGoogleFont] failed to fetch CSS: ${cssRes.status}`);
  }

  const css = await cssRes.text();
  // ES2017 target なので named capturing group は使えない（要 ES2018+）。位置取り出しで対応。
  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
  const fontUrl = match?.[1];
  if (!fontUrl) {
    throw new Error('[loadGoogleFont] could not find TTF url in Google Fonts CSS');
  }

  const fontRes = await fetch(fontUrl, { cache: 'force-cache' });
  if (!fontRes.ok) {
    throw new Error(`[loadGoogleFont] failed to fetch font: ${fontRes.status}`);
  }
  return fontRes.arrayBuffer();
}
