import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'rating' | 'hd' | 'accent' | 'outline';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide transition-colors';

  const variants = {
    default: 'bg-surface-3 text-zinc-300',
    rating: 'bg-amber-500/10 text-amber-400',
    hd: 'bg-red-950/40 text-accent font-bold',
    accent: 'bg-accent text-on-accent',
    outline: 'bg-transparent text-zinc-400',
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
