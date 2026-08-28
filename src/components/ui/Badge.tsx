import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'rating' | 'hd' | 'accent' | 'outline';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide transition-colors';

  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    rating: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    hd: 'bg-red-950/40 text-red-400 border border-red-500/30 font-bold',
    accent: 'bg-red-600 text-white',
    outline: 'bg-transparent text-zinc-400 border border-zinc-700',
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
