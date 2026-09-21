'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';
import { formatYear } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { useUserStore } from '@/lib/store';

interface MediaCardProps {
  item: NormalizedMedia;
  priority?: boolean;
  rank?: number;
}

export function MediaCard({ item, priority = false }: MediaCardProps) {
  const [posterError, setPosterError] = useState(false);
  const { history, hasHydrated } = useUserStore();

  const detailsUrl = `/details/${item.type}/${item.id}`;
  const playUrl = `/watch/${item.type}/${item.id}`;

  // Check if item is in watch history
  const historyItem = hasHydrated
    ? history.find((h) => h.id === item.id && h.type === item.type)
    : undefined;

  const imageUrl = posterError
    ? getBackdropUrl(item.backdropPath, 'w780')
    : getPosterUrl(item.posterPath, 'w500');

  return (
    <div className="group/card relative flex flex-col w-full">
      {/* 2:3 Vertical Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.08] hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-black/90 hover:-translate-y-1.5 flex flex-col">
        <Image
          src={imageUrl}
          alt={item.title}
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
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-black border border-amber-500/20 shadow-md">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              <span>{item.rating.toFixed(1)}</span>
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

        {/* Play Button Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-20">
          <Link
            href={playUrl}
            className="w-12 h-12 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer"
            title="Play Now"
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </Link>
        </div>

        {/* Clickable Card Link to Details */}
        <Link href={detailsUrl} className="absolute inset-0 z-10" />

        {/* Bottom Progress Bar Line if watched */}
        {historyItem && (
          <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
            {historyItem.progressPercent ? (
              <div className="w-full h-1 bg-black/70 overflow-hidden">
                <div
                  className="h-full bg-red-600 shadow-[0_0_8px_rgba(229,9,20,0.9)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(3, historyItem.progressPercent))}%` }}
                />
              </div>
            ) : (
              <div className="w-full h-1 bg-red-600/80 shadow-[0_0_6px_rgba(229,9,20,0.7)]" />
            )}
          </div>
        )}
      </div>

      {/* Details Title & Metadata below */}
      <Link href={detailsUrl} className="pt-2.5 pb-1 flex flex-col gap-0.5">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate group-hover/card:text-red-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          {item.releaseDate && <span>{formatYear(item.releaseDate)}</span>}
          {item.releaseDate && <span className="text-zinc-600">•</span>}
          <span className="capitalize">{item.type === 'movie' ? 'Movie' : 'Series'}</span>
        </div>
      </Link>
    </div>
  );
}
