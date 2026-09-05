'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, History, Trash2, Clock, ChevronLeft, ChevronRight, Info, Eye } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { WatchHistoryItem } from '@/types/tmdb';
import { getBackdropUrl, getTrailerKey } from '@/lib/tmdb';
import { formatRelativeTime, formatSeconds, formatRuntime, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';

interface ContinueWatchingCardProps {
  item: WatchHistoryItem;
  onRemove: (id: number, type: 'movie' | 'tv') => void;
}

function ContinueWatchingCard({ item, onRemove }: ContinueWatchingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isTrailerReady, setIsTrailerReady] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const detailsUrl = `/details/${item.type}/${item.id}`;
  const playUrl =
    item.type === 'tv' && item.season && item.episode
      ? `/watch/tv/${item.id}?season=${item.season}&episode=${item.episode}`
      : `/watch/${item.type}/${item.id}`;

  const durationFormatted = item.durationSeconds
    ? formatRuntime(Math.floor(item.durationSeconds / 60))
    : '';

  const progressMins = item.progressSeconds ? Math.floor(item.progressSeconds / 60) : 0;
  const durationMins = item.durationSeconds ? Math.floor(item.durationSeconds / 60) : 0;

  const progressLabel =
    durationMins > 0
      ? `${progressMins}m of ${durationMins}m`
      : item.timestampFormatted
      ? item.timestampFormatted
      : item.progressSeconds
      ? formatSeconds(item.progressSeconds)
      : '';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // 300ms debounce before loading trailer teaser
    hoverTimerRef.current = setTimeout(async () => {
      try {
        const key = await getTrailerKey(item.type, item.id);
        setTrailerKey(key);
      } catch {
        setTrailerKey(null);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsTrailerReady(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTrailerKey(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group/item relative w-[280px] sm:w-[320px] md:w-[350px] flex-shrink-0 rounded-3xl overflow-hidden bg-black/35 hover:bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 shadow-2xl opacity-85 hover:opacity-100 hover:-translate-y-1.5 flex flex-col"
    >
      {/* 16:9 Backdrop Image / Hover Trailer Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        {/* Hover Autoplaying Muted Trailer */}
        {trailerKey ? (
          <div
            className={cn(
              'relative w-full h-full overflow-hidden scale-135 pointer-events-none transition-opacity duration-700',
              isTrailerReady ? 'opacity-100' : 'opacity-0'
            )}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&playsinline=1&modestbranding=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
              title={`${item.title} Trailer`}
              onLoad={() => {
                setTimeout(() => setIsTrailerReady(true), 700);
              }}
              allow="autoplay; encrypted-media"
              className="w-full h-full object-cover border-0 pointer-events-none"
            />
          </div>
        ) : null}

        {/* Backdrop Fallback & Buffer Cover */}
        <Image
          src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 280px, 350px"
          className={cn(
            'object-cover group-hover/item:scale-105 transition-all duration-500 brightness-90',
            isTrailerReady && trailerKey ? 'opacity-0' : 'opacity-100'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          {trailerKey && isTrailerReady ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-[10px] font-black uppercase text-white shadow-md animate-in fade-in duration-300">
              Teaser Preview
            </span>
          ) : (
            <span />
          )}

          {/* Remove from History Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.id, item.type);
            }}
            title="Remove from history"
            className="p-2 rounded-full bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg hover:scale-110 pointer-events-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons Row on Hover (Play, Bookmark) */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Link
              href={detailsUrl}
              className="w-10 h-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="View Details"
            >
              <Play className="w-4 h-4 fill-black ml-0.5" />
            </Link>

            <BookmarkButton
              item={{
                id: item.id,
                type: item.type,
                title: item.title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                vote_average: item.vote_average,
                release_date: item.release_date,
              }}
              variant="icon"
            />
          </div>

          {/* Progress duration label */}
          {progressLabel && (
            <span className="text-[11px] font-bold text-zinc-300 bg-black/70 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
              {progressLabel}
            </span>
          )}
        </div>

        {/* Bottom Progress Bar Line */}
        <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
          {item.progressPercent ? (
            <div className="w-full h-1.5 bg-black/70 overflow-hidden">
              <div
                className="h-full bg-red-600 shadow-[0_0_10px_rgba(229,9,20,0.9)] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(3, item.progressPercent))}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-1.5 bg-red-600/80 shadow-[0_0_8px_rgba(229,9,20,0.7)]" />
          )}
        </div>
      </div>

      {/* Details Footer */}
      <Link href={detailsUrl} className="p-4 flex flex-col gap-1 bg-black/30">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-black text-sm sm:text-base text-zinc-100 truncate group-hover/item:text-red-400 transition-colors">
            {item.title}
          </h3>
          <span className="text-[11px] text-zinc-500 font-semibold flex-shrink-0">
            {formatRelativeTime(item.lastWatchedAt)}
          </span>
        </div>

        {item.type === 'tv' && item.season && item.episode ? (
          <p className="text-xs text-red-400 font-bold line-clamp-1">
            Season {item.season}, Ep {item.episode} {item.episodeTitle ? `• ${item.episodeTitle}` : ''}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 capitalize font-medium">
            {item.type} {durationFormatted ? `• ${durationFormatted}` : ''}
          </p>
        )}
      </Link>
    </div>
  );
}

export function ContinueWatchingRow() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { history, removeFromHistory, hasHydrated } = useUserStore();

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  if (!hasHydrated || history.length === 0) return null;

  return (
    <section className="relative w-full py-6 group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <History className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Continue Watching
          </h2>
        </div>
        <Link
          href="/watchlist"
          className="text-xs md:text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          View All History →
        </Link>
      </div>

      {/* Track & Scroll Controls */}
      <div className="relative">
        {/* Left Scroll Button */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          className="absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/85 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xl opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-2xl border border-white/15 cursor-pointer hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
        >
          {history.slice(0, 15).map((item) => (
            <ContinueWatchingCard
              key={`${item.type}-${item.id}`}
              item={item}
              onRemove={removeFromHistory}
            />
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          className="absolute -right-3 md:-right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/85 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xl opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-2xl border border-white/15 cursor-pointer hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}


