/**
 * 匿名ユーザー識別子。AI 判定のレート制限（匿名 1 回 / 日）の鍵に使う。
 * `crypto.randomUUID()` を `localStorage` に永続化する。Client Component 専用。
 */

const STORAGE_KEY = 'hana-nav:anon-id';

export function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getAnonymousId must be called in the browser');
  }
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
