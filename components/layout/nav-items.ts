/**
 * グローバルナビ項目。Header / MobileNav の両方で使う。
 * URL は `docs/specs/pages.md` 準拠。
 */
export const NAV_ITEMS = [
  { label: 'スポット検索', href: '/spots' },
  { label: '花の種類', href: '/flowers' },
  { label: 'AI花判定', href: '/identify' },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
