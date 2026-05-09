'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
};

/**
 * 現在のパスと一致したらアクティブスタイルを当てるリンク。
 * `exact=false` の場合、`href` と前方一致した時もアクティブ扱いにする
 * （例：`/spots/123` でも `/spots` ナビをハイライト）。
 */
export function NavLink({
  href,
  children,
  className,
  activeClassName = 'text-brand',
  exact = false,
}: Props) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={cn(className, isActive && activeClassName)}>
      {children}
    </Link>
  );
}
