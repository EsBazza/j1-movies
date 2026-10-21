import React from 'react';
import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 animate-pulse', className)}>
      <div className="w-full aspect-[2/3] rounded-2xl bg-zinc-800/60" />
      <div className="h-4 w-3/4 rounded bg-zinc-800/60 mt-1" />
      <div className="h-3 w-1/2 rounded bg-zinc-800/40" />
    </div>
  );
}
