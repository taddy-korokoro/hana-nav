import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        brand: 'rounded-pill bg-brand text-white hover:bg-brand-hover',
        outline:
          'rounded-card border border-line bg-white text-ink hover:border-ink hover:bg-ink hover:text-white',
        ghost: 'rounded-card text-ink hover:bg-surface-2',
        danger: 'rounded-pill bg-danger text-white hover:bg-danger/90',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm [&_svg]:size-4',
        md: 'h-11 px-5 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'size-10 rounded-pill [&_svg]:size-5',
        'icon-sm': 'size-9 rounded-pill [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
    },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingText?: string;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const isDisabled = disabled || loading;

  // asChild の場合は Slot が単一子要素を要求するので、children をそのまま流す。
  // loading 状態の表示が必要なら asChild ではなく button を使う想定。
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant ?? 'brand'}
        data-size={size ?? 'md'}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'brand'}
      data-size={size ?? 'md'}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" label="" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
