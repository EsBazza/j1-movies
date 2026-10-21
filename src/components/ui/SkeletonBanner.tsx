import React from 'react';

/** Placeholder sized like the hero banners so content doesn't jump when it loads. */
export function SkeletonBanner() {
  return (
    <div
      className="relative w-full min-h-[560px] sm:min-h-[740px] lg:min-h-[860px] bg-zinc-900/60 animate-pulse overflow-hidden"
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      <div className="absolute bottom-16 left-4 sm:left-10 lg:left-16 right-4 max-w-2xl flex flex-col gap-4">
        <div className="h-6 w-32 bg-zinc-800/70 rounded" />
        <div className="h-12 w-3/4 max-w-md bg-zinc-800 rounded" />
        <div className="h-4 w-full bg-zinc-800/50 rounded" />
        <div className="h-4 w-4/5 bg-zinc-800/50 rounded" />
        <div className="flex gap-4 pt-2">
          <div className="h-12 w-36 bg-zinc-800 rounded-full" />
          <div className="h-12 w-36 bg-zinc-800/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}
