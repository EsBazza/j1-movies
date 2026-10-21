'use client';

import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useUserStoreSelector, userStoreActions } from '@/lib/store';
import { MediaType } from '@/types/tmdb';
import { toast } from '@/components/ui/Toast';
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
  const isSaved = useUserStoreSelector((s) => s.watchlist.some((w) => w.id === item.id && w.type === item.type));

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      userStoreActions.removeFromWatchlist(item.id, item.type);
      toast(`Removed "${item.title}" from My List`, {
        tone: 'info',
        action: { label: 'Undo', onClick: () => userStoreActions.addToWatchlist(item) },
      });
    } else {
      userStoreActions.addToWatchlist(item);
      toast(`Added "${item.title}" to My List`);
    }
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isSaved}
        className={cn(
          'flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200',
          isSaved
            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700'
            : 'bg-zinc-900/80 text-white border border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-500',
          className
        )}
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="w-4 h-4 text-accent fill-accent" aria-hidden="true" />
            <span>In My List</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4 text-zinc-300" aria-hidden="true" />
            <span>Add to My List</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
      className={cn(
        'p-2 rounded-full backdrop-blur-md transition-colors duration-200',
        isSaved
          ? 'bg-accent/90 text-white shadow-lg shadow-red-600/30 hover:bg-accent-hover'
          : 'bg-black/60 text-white/90 hover:bg-black/80 hover:text-white border border-white/10',
        className
      )}
    >
      {isSaved ? <BookmarkCheck className="w-4 h-4 fill-white" aria-hidden="true" /> : <Bookmark className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
}
