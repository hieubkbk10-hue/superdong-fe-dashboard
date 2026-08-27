import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none whitespace-nowrap gap-1',
  {
    variants: {
      variant: {
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-medium',
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        primary: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        outline: 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = React.memo(({ className, variant, ...props }) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
});
Badge.displayName = 'CommonBadge';
