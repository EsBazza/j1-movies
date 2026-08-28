'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Film, Tv } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getPosterUrl } from '@/lib/tmdb';
import { formatYear } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { Badge } from '@/components/ui/Badge';

interface MediaCardProps {
  item: NormalizedMedia;
  priority?: boolean;
}

export function MediaCard({ item, priority = false }: MediaCardProps) {
  return (
    <div className="group relative flex flex-col w-full rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800/80 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-950/20 hover:-translate-y-1">
      {/* Poster Aspect Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <Image
          src={getPosterUrl(item.posterPath, 'w500')}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-108"
        />

        {/* Top Badges & Bookmark Action Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {item.rating > 0 ? (
            <Badge variant="rating" className="flex items-center gap-1 shadow-lg backdrop-blur-md bg-black/70 border-amber-500/30 font-bold text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{item.rating}</span>
            </Badge>
          ) : (
            <div />
          )}

          <div className="pointer-events-auto">
            <BookmarkButton
              item={{
                id: item.id,
                type: item.type,
                title: item.title,
                poster_path: item.posterPath,
                backdrop_path: item.backdropPath,
                vote_average: item.rating,
                release_date: item.releaseDate,
              }}
            />
          </div>
        </div>

        {/* Play Button Overlay on Hover */}
        <Link
          href={`/watch/${item.type}/${item.id}`}
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10"
        >
          <div className="w-13 h-13 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-red-400/30">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </Link>
      </div>

      {/* Info Details below */}
      <Link href={`/details/${item.type}/${item.id}`} className="p-3.5 flex flex-col gap-1.5 bg-zinc-900/60 backdrop-blur-sm">
        <h3 className="font-bold text-sm text-zinc-100 truncate group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1">
            {item.type === 'movie' ? (
              <Film className="w-3 h-3 text-red-500" />
            ) : (
              <Tv className="w-3 h-3 text-cyan-400" />
            )}
            <span className="capitalize text-zinc-300">{item.type}</span>
          </span>
          {item.releaseDate && <span className="text-zinc-500">{formatYear(item.releaseDate)}</span>}
        </div>
      </Link>
    </div>
  );
}
