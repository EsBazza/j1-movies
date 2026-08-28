'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Star } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getBackdropUrl } from '@/lib/tmdb';
import { formatYear } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { Badge } from '@/components/ui/Badge';

interface HeroBannerProps {
  item: NormalizedMedia;
}

export function HeroBanner({ item }: HeroBannerProps) {
  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* High-res Backdrop Image */}
      <div className="absolute inset-0 bg-zinc-950">
        <Image
          src={getBackdropUrl(item.backdropPath || item.posterPath, 'original')}
          alt={item.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top filter brightness-[0.85]"
        />
        {/* Multi-angle Cinema Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 md:pb-16 z-10">
        <div className="max-w-2xl flex flex-col gap-3 md:gap-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="accent" className="uppercase font-bold tracking-wider">
              {item.type === 'movie' ? 'Featured Movie' : 'Featured Series'}
            </Badge>
            {item.rating > 0 && (
              <Badge variant="rating" className="flex items-center gap-1 bg-black/60 backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{item.rating} TMDB</span>
              </Badge>
            )}
            {item.releaseDate && (
              <Badge variant="outline" className="bg-black/40 backdrop-blur-md">
                {formatYear(item.releaseDate)}
              </Badge>
            )}
            <Badge variant="hd">4K HDR</Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
            {item.title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed drop-shadow">
            {item.overview || 'No synopsis provided for this title.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link
              href={`/watch/${item.type}/${item.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={`/details/${item.type}/${item.id}`}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-100 font-semibold text-sm border border-zinc-700/60 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </Link>

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
              variant="button"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
