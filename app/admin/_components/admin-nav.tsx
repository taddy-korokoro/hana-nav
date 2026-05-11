'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COPY } from '@/lib/constants/copy';
import { cn } from '@/lib/utils';

const ITEMS: { href: string; label: string }[] = [
  { href: '/admin', label: COPY.admin.nav.home },
  { href: '/admin/spots', label: COPY.admin.nav.spots },
  { href: '/admin/spots/pending', label: COPY.admin.nav.spotsPending },
  { href: '/admin/spots/new', label: COPY.admin.nav.spotsNew },
  { href: '/admin/flowers', label: COPY.admin.nav.flowers },
  { href: '/admin/flowers/new', label: COPY.admin.nav.flowersNew },
  { href: '/admin/images', label: COPY.admin.nav.images },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/spots/pending') return pathname === '/admin/spots/pending';
  if (href === '/admin/spots/new') return pathname === '/admin/spots/new';
  if (href === '/admin/flowers/new') return pathname === '/admin/flowers/new';
  if (href === '/admin/spots') {
    return (
      pathname.startsWith('/admin/spots') &&
      pathname !== '/admin/spots/pending' &&
      pathname !== '/admin/spots/new'
    );
  }
  if (href === '/admin/flowers') {
    return pathname.startsWith('/admin/flowers') && pathname !== '/admin/flowers/new';
  }
  if (href === '/admin/images') {
    return pathname.startsWith('/admin/images');
  }
  return pathname === href;
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-2 text-sm">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-pill px-3 py-1.5 transition',
              active
                ? 'bg-ink text-white'
                : 'border border-line bg-white text-ink-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
