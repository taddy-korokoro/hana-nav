/**
 * 匿名ユーザー識別子。AI 判定のレート制限（匿名 1 回 / 日）の鍵に使う。
 * UUID v4 を `localStorage` に永続化する。Client Component 専用。
 *
 * 注意: `crypto.randomUUID()` は secure context (HTTPS / localhost) でしか使えず、
 * LAN IP HTTP（実機検証で よくある `http://192.168.x.x:3000`）の Safari では
 * `undefined` になる。`crypto.getRandomValues` は非 secure context でも動くため、
 * フォールバックで RFC 4122 v4 を組み立てる。
 */

const STORAGE_KEY = 'hana-nav:anon-id';

export function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getAnonymousId must be called in the browser');
  }
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUuidV4();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

function generateUuidV4(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
