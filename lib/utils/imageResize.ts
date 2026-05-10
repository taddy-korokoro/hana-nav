/**
 * AI 判定にアップロードする前にクライアント側で画像を縮小する。
 *
 * - 長辺 1024px に収まるよう縦横比を維持してリサイズ
 * - JPEG 品質 0.8 で再エンコード
 * - 結果が 2MB を超える場合は品質を段階的に下げて 2MB 以下にする
 *
 * Canvas を使うため Client Component / ブラウザ専用。
 */

const MAX_DIMENSION = 1024;
const TARGET_BYTES = 2 * 1024 * 1024;
const MIN_QUALITY = 0.5;

export async function resizeImage(file: File): Promise<File> {
  if (typeof window === 'undefined') {
    throw new Error('resizeImage must be called in the browser');
  }

  const bitmap = await loadBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.8;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.1);
    blob = await canvasToJpeg(canvas, quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w >= h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))),
      'image/jpeg',
      quality,
    );
  });
}
