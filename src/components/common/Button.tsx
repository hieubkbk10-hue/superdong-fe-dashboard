import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700',
        light: 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800',
        dark: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200',
        link: 'text-blue-500 hover:underline',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs',
        warning: 'bg-amber-500 text-white hover:bg-amber-600',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
        ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
      },
      size: {
        default: 'py-1.5 px-3 text-[13px]',
        xs: 'text-xs py-0.5 px-2',
        sm: 'text-xs py-1 px-2.5',
        lg: 'text-base py-2 px-5 rounded-lg',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : 'button';
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }
  )
);
Button.displayName = 'CommonButton';
