'use client';

import React from 'react';
import { TMDBGenre } from '@/types/tmdb';
import { cn } from '@/lib/utils';

interface GenrePillsProps {
  genres: TMDBGenre[];
  activeGenreId?: number | null;
  onSelectGenre: (genreId: number | null) => void;
}

export function GenrePills({ genres, activeGenreId, onSelectGenre }: GenrePillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      <button
        onClick={() => onSelectGenre(null)}
        className={cn(
          'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer',
          activeGenreId === null || activeGenreId === undefined
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
        )}
      >
        All
      </button>

      {genres.map((genre) => {
        const isActive = activeGenreId === genre.id;
        return (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            )}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}
