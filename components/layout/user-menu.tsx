'use client';

import Link from 'next/link';
import { logout } from '@/app/auth/logout/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookmarkIcon, LogoutIcon, ShieldIcon, UserIcon } from './icons';

type UserMenuProps = {
  email: string;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function UserMenu({ email, username, avatarUrl, isAdmin }: UserMenuProps) {
  const displayName = username ?? email.split('@')[0];
  const initial = (username ?? email).slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="ユーザーメニュー"
        className="grid size-10 place-items-center rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Avatar size="default">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="text-sm font-normal">
          <p className="truncate font-medium text-ink">{displayName}</p>
          <p className="truncate text-xs text-ink-muted">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/mypage">
            <UserIcon className="size-4" />
            マイページ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mypage/bookmarks">
            <BookmarkIcon className="size-4" />
            ブックマーク
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldIcon className="size-4" />
                管理画面
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <form action={logout} className="contents">
            <button type="submit" className="flex w-full items-center gap-1.5 text-left">
              <LogoutIcon className="size-4" />
              ログアウト
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
