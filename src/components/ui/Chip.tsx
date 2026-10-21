import React from 'react';
import { cn } from '@/lib/utils';

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean };

/** Toggle chip for filters (genres, seasons, types). Exposes state via aria-pressed. */
export function Chip({ selected = false, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-[background-color,color] duration-200',
        selected ? 'bg-white text-black' : 'bg-white/8 text-zinc-300 hover:bg-white/14 hover:text-white',
        className
      )}
      {...props}
    />
  );
}
