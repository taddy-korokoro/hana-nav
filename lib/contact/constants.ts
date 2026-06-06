/**
 * お問い合わせフォーム共通の定数・型。
 *
 * Server/Client の両方から import される（フォームの Client Component と
 * クエリ層 / Server Action が同じ enum を共有する）ため、`server-only` を
 * 引きずらないようにこのファイルだけで完結させる。`lib/queries/contact.ts`
 * は本ファイルを再 export する形でラップしている。
 */

export const CONTACT_CATEGORIES = ['INQUIRY', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER'] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
