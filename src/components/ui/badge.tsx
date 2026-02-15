import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-50 text-brand-700',
        secondary: 'bg-background-muted text-foreground-muted',
        destructive: 'bg-red-50 text-red-700',
        outline: 'border border-border text-foreground-muted',
        granted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        refused: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
        appealed: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
        withdrawn: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
        conditions: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
