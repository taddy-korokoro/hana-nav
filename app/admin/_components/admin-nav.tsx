'use client';

import {
  Activity,
  Clock,
  Flower2,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COPY } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const ITEMS: NavItem[] = [
  { href: '/admin', label: COPY.admin.nav.home, icon: LayoutDashboard },
  { href: '/admin/spots', label: COPY.admin.nav.spots, icon: MapPin },
  { href: '/admin/spots/pending', label: COPY.admin.nav.spotsPending, icon: Clock },
  { href: '/admin/flowers', label: COPY.admin.nav.flowers, icon: Flower2 },
  { href: '/admin/images', label: COPY.admin.nav.images, icon: ImageIcon },
  { href: '/admin/users', label: COPY.admin.nav.users, icon: Users },
  { href: '/admin/reviews', label: COPY.admin.nav.reviews, icon: MessageSquare },
  { href: '/admin/contact', label: COPY.admin.nav.contact, icon: Inbox },
  { href: '/admin/ai-usage', label: COPY.admin.nav.aiUsage, icon: Activity },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/spots/pending') return pathname === '/admin/spots/pending';
  if (href === '/admin/spots') {
    return pathname.startsWith('/admin/spots') && pathname !== '/admin/spots/pending';
  }
  if (href === '/admin/flowers') return pathname.startsWith('/admin/flowers');
  if (href === '/admin/images') return pathname.startsWith('/admin/images');
  if (href === '/admin/users') return pathname.startsWith('/admin/users');
  if (href === '/admin/reviews') return pathname.startsWith('/admin/reviews');
  if (href === '/admin/contact') return pathname.startsWith('/admin/contact');
  if (href === '/admin/ai-usage') return pathname.startsWith('/admin/ai-usage');
  return pathname === href;
}

type Props = {
  onNavigate?: () => void;
};

/**
 * 管理画面の縦置きナビゲーション。サイドバー（`lg+`）と Sheet ドロワー（`<lg`）の
 * 両方から同じコンポーネントを呼び出す。`onNavigate` が渡された場合はリンク
 * クリック時にコールバックを叩いて Sheet を閉じる。
 */
export function AdminNav({ onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav aria-label={COPY.admin.nav.eyebrow}>
      <ul className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-card px-3 py-2 text-sm transition',
                  active
                    ? 'bg-brand-soft font-medium text-brand'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <Icon
                  className={cn('size-4 shrink-0', active ? 'text-brand' : 'text-ink-faint')}
                  strokeWidth={1.75}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
