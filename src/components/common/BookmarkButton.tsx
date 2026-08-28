'use client';

import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { MediaType, WatchlistItem } from '@/types/tmdb';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  item: {
    id: number;
    type: MediaType;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date?: string;
  };
  variant?: 'icon' | 'button';
  className?: string;
}

export function BookmarkButton({ item, variant = 'icon', className }: BookmarkButtonProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist, hasHydrated } = useUserStore();

  const isSaved = hasHydrated && watchlist.some((w) => w.id === item.id && w.type === item.type);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      removeFromWatchlist(item.id, item.type);
    } else {
      addToWatchlist(item);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer',
          isSaved
            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700'
            : 'bg-zinc-900/80 text-white border border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-500',
          className
        )}
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="w-4 h-4 text-red-500 fill-red-500" />
            <span>In Watchlist</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4 text-zinc-300" />
            <span>Add to Watchlist</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
      className={cn(
        'p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer',
        isSaved
          ? 'bg-red-600/90 text-white shadow-lg shadow-red-600/30 hover:bg-red-700'
          : 'bg-black/60 text-white/90 hover:bg-black/80 hover:text-white border border-white/10',
        className
      )}
    >
      {isSaved ? (
        <BookmarkCheck className="w-4 h-4 fill-white" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </button>
  );
}
