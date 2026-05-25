import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  /**
   * スクリーンリーダー向けラベル。
   * 空文字 / null を渡すと装飾扱い（`aria-hidden`）になる。
   * 親要素が `aria-busy` などで状態を伝える場合は空文字推奨。
   */
  label?: string | null;
};

export function Spinner({ size = 'md', className, label = '読み込み中' }: SpinnerProps) {
  const isDecorative = label === '' || label === null;

  if (isDecorative) {
    return (
      <Loader2
        aria-hidden
        className={cn('animate-spin text-current', SIZE_CLASS[size], className)}
      />
    );
  }

  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn('animate-spin text-current', SIZE_CLASS[size], className)}
    />
  );
}
