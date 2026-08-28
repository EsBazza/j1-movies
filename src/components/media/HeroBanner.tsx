'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Star, Sparkles, Film, Tv } from 'lucide-react';
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
    <div className="relative w-full h-[75vh] min-h-[540px] max-h-[820px] overflow-hidden">
      {/* High-res Backdrop Image with Multi-layer Vignettes */}
      <div className="absolute inset-0 bg-zinc-950">
        <Image
          src={getBackdropUrl(item.backdropPath || item.posterPath, 'original')}
          alt={item.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top filter brightness-[0.82] contrast-105 scale-105 animate-fade-in transition-transform duration-1000"
        />
        {/* Deep Cinema Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 md:pb-20 z-10">
        <div className="max-w-2xl flex flex-col gap-4">
          {/* Badges Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge variant="accent" className="uppercase font-extrabold tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>{item.type === 'movie' ? 'Spotlight Movie' : 'Spotlight Series'}</span>
            </Badge>

            {item.rating > 0 && (
              <Badge variant="rating" className="flex items-center gap-1 bg-black/70 backdrop-blur-md border-amber-500/30 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{item.rating} TMDB</span>
              </Badge>
            )}

            {item.releaseDate && (
              <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-zinc-300">
                {formatYear(item.releaseDate)}
              </Badge>
            )}

            <Badge variant="hd" className="bg-red-950/60 text-red-400 border-red-500/30">
              4K ULTRA HD
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-[1.1]">
            {item.title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-lg max-w-xl font-normal">
            {item.overview || 'Stream this top-rated title in crystal clear high definition.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            <Link
              href={`/watch/${item.type}/${item.id}`}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/40 border border-red-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={`/details/${item.type}/${item.id}`}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-semibold text-sm border border-zinc-700/70 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            >
              <Info className="w-4 h-4 text-zinc-300" />
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
