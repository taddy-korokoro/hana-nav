/**
 * 旅のしおり（/identify/story）の Canvas 描画で使うヘルパー。
 *
 * - `loadImage`: data URL / 同一オリジン / Supabase Storage の画像を Canvas に描けるよう
 *   `crossOrigin = 'anonymous'` で読み込む。CORS が許可されないと toBlob 時に
 *   `Tainted canvas` エラーで落ちるため、外部画像の参照元には注意する。
 * - `drawImageCover`: CSS の `object-fit: cover` 相当のクロップ描画。
 * - `wrapText`: 日本語が多いため文字単位で改行する素朴な実装。
 */

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // data URL ではこのフラグは無害。外部画像はサーバーが Access-Control-Allow-Origin
    // を返している必要がある。
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * 中央寄せで折り返す。`ctx.textAlign = 'center'` の状態で呼ぶ前提。
 * `maxLines` を超える場合は最終行末尾を `…` で切り詰める（Canvas が縦に
 * 溢れて他要素と重なるのを防ぐ）。戻り値は最終行の y 座標。
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Number.POSITIVE_INFINITY,
): number {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = '';
  for (const char of chars) {
    if (char === '\n') {
      lines.push(line);
      line = '';
      continue;
    }
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  const truncated = lines.length > maxLines;
  const visible = truncated ? lines.slice(0, maxLines) : lines;
  if (truncated && visible.length > 0) {
    const ellipsis = '…';
    let last = visible[visible.length - 1];
    while (last.length > 0 && ctx.measureText(last + ellipsis).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visible[visible.length - 1] = last + ellipsis;
  }

  let yPos = y;
  for (let i = 0; i < visible.length; i++) {
    ctx.fillText(visible[i], x, yPos);
    if (i < visible.length - 1) yPos += lineHeight;
  }
  return yPos;
}
