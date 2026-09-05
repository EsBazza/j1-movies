'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Film, Tv, Eye, Clock, Info } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getPosterUrl, getBackdropUrl, getTrailerKey } from '@/lib/tmdb';
import { formatYear, formatSeconds, formatRelativeTime } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { QuickPreviewModal } from '@/components/media/QuickPreviewModal';
import { Badge } from '@/components/ui/Badge';
import { useUserStore } from '@/lib/store';

interface MediaCardProps {
  item: NormalizedMedia;
  priority?: boolean;
}

export function MediaCard({ item, priority = false }: MediaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { history, hasHydrated } = useUserStore();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Check if item is in watch history
  const historyItem = hasHydrated
    ? history.find((h) => h.id === item.id && h.type === item.type)
    : undefined;

  const updatePopoverPosition = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const popWidth = Math.min(360, window.innerWidth - 32);

    let left = rect.left + rect.width / 2 - popWidth / 2;
    if (left < 16) left = 16;
    if (left + popWidth > window.innerWidth - 16) left = window.innerWidth - popWidth - 16;

    // Center vertically around the card center, clamped inside the viewport
    let top = rect.top + rect.height / 2 - 200;
    if (top < 24) top = 24;
    if (top + 420 > window.innerHeight - 24) top = Math.max(24, window.innerHeight - 444);

    setPopoverCoords({ top, left, width: popWidth });
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // 300ms debounce before popping out teaser preview
    hoverTimerRef.current = setTimeout(async () => {
      updatePopoverPosition();
      try {
        const key = await getTrailerKey(item.type, item.id);
        setTrailerKey(key);
      } catch {
        setTrailerKey(null);
      }
      setIsExpanded(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Grace period when moving between base card and portal popover
    closeTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
      setTrailerKey(null);
    }, 200);
  };

  const detailsHref = `/details/${item.type}/${item.id}`;

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full"
    >
      {/* 1. Base Poster Card */}
      <div className="group/card relative flex flex-col w-full rounded-2xl overflow-hidden bg-black/30 hover:bg-black/55 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1.5 opacity-80 hover:opacity-100">
        {/* Poster Container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950 shine-overlay">
          <Image
            src={getPosterUrl(item.posterPath, 'w500')}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover/card:scale-108"
          />

          {/* Top Badges & Actions */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            {item.rating > 0 ? (
              <Badge variant="rating" className="flex items-center gap-1 shadow-lg backdrop-blur-md bg-black/70 border-amber-500/30 font-bold text-[11px]">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{item.rating}</span>
              </Badge>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPreviewOpen(true);
                }}
                title="Quick Preview"
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md hover:scale-105 cursor-pointer opacity-0 group-hover/card:opacity-100"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

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

          {/* Watch History Progress Indicator */}
          {historyItem && (
            <div className="absolute bottom-0 inset-x-0 z-10">
              {historyItem.progressPercent ? (
                <div className="w-full h-1.5 bg-black/70 overflow-hidden">
                  <div
                    className="h-full bg-red-600 shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                    style={{ width: `${Math.min(100, historyItem.progressPercent)}%` }}
                  />
                </div>
              ) : (
                <div className="w-full h-1 bg-red-600/80 shadow-[0_0_6px_rgba(229,9,20,0.6)]" />
              )}
            </div>
          )}

          {/* Card Click Overlay */}
          <Link
            href={detailsHref}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center z-10 cursor-pointer"
          >
            <div className="w-13 h-13 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 transform scale-75 group-hover/card:scale-100 transition-transform duration-300 border border-red-400/30">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </Link>
        </div>

        {/* Info Details below */}
        <Link href={detailsHref} className="p-3.5 flex flex-col gap-1.5 bg-black/25 backdrop-blur-md">
          <h3 className="font-bold text-sm text-zinc-100 truncate group-hover/card:text-red-400 transition-colors">
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

          {/* If item in history, show timestamp info */}
          {historyItem && (
            <div className="flex items-center gap-1 text-[11px] text-red-400/90 font-medium pt-0.5 border-t border-white/5">
              <Clock className="w-3 h-3 text-red-500" />
              {historyItem.timestampFormatted ? (
                <span>Left off at {historyItem.timestampFormatted}</span>
              ) : historyItem.progressSeconds ? (
                <span>Left off at {formatSeconds(historyItem.progressSeconds)}</span>
              ) : (
                <span>Watched {formatRelativeTime(historyItem.lastWatchedAt)}</span>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* 2. Expanded 16:9 Floating Popover via Portal (NEVER clipped by overflow-x containers) */}
      {mounted &&
        isExpanded &&
        popoverCoords &&
        createPortal(
          <div
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
              setIsExpanded(true);
            }}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'fixed',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: `${popoverCoords.width}px`,
              zIndex: 99999,
            }}
            className="rounded-3xl overflow-hidden bg-[#0a0d14]/95 backdrop-blur-2xl border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.95)] animate-in fade-in zoom-in-95 duration-200 flex flex-col pointer-events-auto"
          >
            {/* Top 16:9 Widescreen Video Player Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {trailerKey ? (
                <div className="relative w-full h-full overflow-hidden scale-135 pointer-events-none">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&playsinline=1&modestbranding=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
                    title={`${item.title} Trailer`}
                    allow="autoplay; encrypted-media"
                    className="w-full h-full object-cover border-0 pointer-events-none"
                  />
                </div>
              ) : (
                <Image
                  src={getBackdropUrl(item.backdropPath || item.posterPath, 'w780')}
                  alt={item.title}
                  fill
                  sizes="380px"
                  className="object-cover brightness-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-transparent pointer-events-none" />

              {/* Quick Title overlay inside video top */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/90 backdrop-blur-md text-[10px] font-black uppercase text-white shadow-md">
                  {trailerKey ? 'Teaser Preview' : 'HD Cinema'}
                </span>
                {item.rating > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {item.rating}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Info & Actions Area */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href={detailsHref}
                  className="w-10 h-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="View Details"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
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
                  variant="icon"
                />
              </div>

              {/* Title & Metadata */}
              <div className="flex flex-col gap-1">
                <h4 className="font-black text-base text-white line-clamp-1">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
                    {item.type === 'movie' ? 'Movie' : 'Series'}
                  </span>
                  {item.releaseDate && (
                    <>
                      <span>•</span>
                      <span>{formatYear(item.releaseDate)}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-[10px] text-red-400 font-bold border border-red-500/30 px-1 rounded">
                    4K
                  </span>
                </div>
              </div>

              {/* Overview preview snippet */}
              {item.overview && (
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {item.overview}
                </p>
              )}

              {/* Watch History Progress if available */}
              {historyItem && (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1 text-red-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    {historyItem.timestampFormatted
                      ? `Left off at ${historyItem.timestampFormatted}`
                      : historyItem.progressSeconds
                      ? `Left off at ${formatSeconds(historyItem.progressSeconds)}`
                      : 'In Watch History'}
                  </span>
                  {historyItem.progressPercent && (
                    <span className="font-bold text-white">{historyItem.progressPercent}%</span>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Quick Preview Pop-up */}
      <QuickPreviewModal
        item={item}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}


