import { cn } from '@/lib/utils';

type FormBannerVariant = 'success' | 'error' | 'info';

type FormBannerProps = {
  variant: FormBannerVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const VARIANT_CLASS: Record<FormBannerVariant, string> = {
  success: 'border border-brand/20 bg-brand-soft text-brand',
  error: 'border border-danger/20 bg-danger-soft text-danger',
  info: 'border border-line bg-surface-2 text-ink',
};

const VARIANT_ROLE: Record<FormBannerVariant, 'alert' | 'status'> = {
  success: 'status',
  error: 'alert',
  info: 'status',
};

export function FormBanner({ variant, title, children, className }: FormBannerProps) {
  return (
    <div
      role={VARIANT_ROLE[variant]}
      className={cn('rounded-card px-4 py-3 text-sm', VARIANT_CLASS[variant], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && 'mt-1', 'text-current/90')}>{children}</div>
    </div>
  );
}
