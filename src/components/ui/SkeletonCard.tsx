import React from 'react';
import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 animate-pulse', className)}>
      <div className="w-full aspect-[2/3] rounded-lg bg-zinc-800/60" />
      <div className="h-4 w-3/4 rounded bg-zinc-800/60" />
      <div className="h-3 w-1/2 rounded bg-zinc-800/40" />
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="relative w-full h-[65vh] min-h-[480px] max-h-[750px] bg-zinc-900 animate-pulse overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute bottom-12 left-6 md:left-12 max-w-2xl flex flex-col gap-4">
        <div className="h-6 w-32 bg-zinc-800/70 rounded" />
        <div className="h-10 w-96 bg-zinc-800 rounded" />
        <div className="h-4 w-full bg-zinc-800/50 rounded" />
        <div className="h-4 w-4/5 bg-zinc-800/50 rounded" />
        <div className="flex gap-4 pt-2">
          <div className="h-11 w-36 bg-zinc-800 rounded-lg" />
          <div className="h-11 w-36 bg-zinc-800/60 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
