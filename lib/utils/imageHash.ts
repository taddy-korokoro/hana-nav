/**
 * クライアント側で画像の SHA-256 を計算してキャッシュキーに使う。
 * 同一画像を連投した場合に Gemini API の呼び出しを省略するための識別子。
 * Client Component / ブラウザ専用。
 */

export async function hashImage(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('hashImage must be called in the browser');
  }
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
