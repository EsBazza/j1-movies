'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';
import { formatYear } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { useUserStoreSelector } from '@/lib/store';

interface MediaCardProps {
  item: NormalizedMedia;
  priority?: boolean;
  rank?: number;
}

export function MediaCard({ item, priority = false, rank }: MediaCardProps) {
  const [posterError, setPosterError] = useState(false);
  // Selector keeps cards from re-rendering on unrelated store writes
  const historyItem = useUserStoreSelector((s) =>
    s.history.find((h) => h.id === item.id && h.type === item.type)
  );

  const detailsUrl = `/details/${item.type}/${item.id}`;
  const playUrl =
    item.type === 'tv' && historyItem?.season && historyItem.episode
      ? `/watch/tv/${item.id}?season=${historyItem.season}&episode=${historyItem.episode}`
      : `/watch/${item.type}/${item.id}`;
  const typeLabel = item.type === 'movie' ? 'Movie' : 'Series';

  const imageUrl = posterError
    ? getBackdropUrl(item.backdropPath, 'w780')
    : getPosterUrl(item.posterPath, 'w500');

  return (
    <div className="group/card relative flex flex-col w-full">
      {/* 2:3 Vertical Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.08] hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-black/90 hover:-translate-y-1.5 flex flex-col">
        <Image
          src={imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 260px"
          onError={() => setPosterError(true)}
          className="object-cover group-hover/card:scale-105 transition-all duration-500 brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges & Bookmark */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          {item.rating > 0 ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-[11px] font-black border border-amber-500/20 shadow-md">
              <Star className="w-2.5 h-2.5 fill-amber-400" aria-hidden="true" />
              <span>
                <span className="sr-only">Rated </span>
                {item.rating.toFixed(1)}
              </span>
            </span>
          ) : (
            <span />
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
              variant="icon"
            />
          </div>
        </div>

        {/* Play button: hover-capable devices only, so a tap on touch opens details */}
        <div className="absolute inset-0 hidden [@media(hover:hover)]:flex items-center justify-center pointer-events-none opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 transition-opacity duration-300 z-20">
          <Link
            href={playUrl}
            className="w-12 h-12 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 pointer-events-none group-hover/card:pointer-events-auto focus-visible:pointer-events-auto"
            aria-label={`Play ${item.title}`}
          >
            <Play className="w-5 h-5 fill-black ml-0.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Whole poster links to details (the title link below is the keyboard stop) */}
        <Link href={detailsUrl} className="absolute inset-0 z-10" tabIndex={-1} aria-hidden="true" />

        {/* Bottom Progress Bar Line if watched */}
        {historyItem?.progressPercent ? (
          <div
            className="absolute bottom-0 inset-x-0 z-20 pointer-events-none h-1 bg-black/70 overflow-hidden"
            role="progressbar"
            aria-label="Watch progress"
            aria-valuenow={historyItem.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-accent shadow-[0_0_8px_rgba(229,9,20,0.9)]"
              style={{ width: `${Math.min(100, Math.max(3, historyItem.progressPercent))}%` }}
            />
          </div>
        ) : null}
      </div>

      {/* Details Title & Metadata below */}
      <Link href={detailsUrl} className="pt-2.5 pb-1 flex flex-col gap-0.5 rounded-md">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate group-hover/card:text-red-400 transition-colors">
          {rank ? <span className="sr-only">Number {rank}: </span> : null}
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          {item.releaseDate && <span>{formatYear(item.releaseDate)}</span>}
          {item.releaseDate && <span className="text-zinc-500" aria-hidden="true">•</span>}
          <span>{typeLabel}</span>
        </div>
      </Link>
    </div>
  );
}
