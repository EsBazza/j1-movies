'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, History, Trash2 } from 'lucide-react';
import { useUserStoreSelector, userStoreActions } from '@/lib/store';
import { WatchHistoryItem } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl, getTrailerKey } from '@/lib/tmdb';
import { formatRelativeTime, formatRuntime, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ScrollRow } from '@/components/ui/ScrollRow';
import { toast } from '@/components/ui/Toast';

function canHover() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ContinueWatchingCard({ item, onRemove }: { item: WatchHistoryItem; onRemove: (item: WatchHistoryItem) => void }) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isTrailerReady, setIsTrailerReady] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef(false);

  const detailsUrl = `/details/${item.type}/${item.id}`;
  const playUrl =
    item.type === 'tv' && item.season && item.episode
      ? `/watch/tv/${item.id}?season=${item.season}&episode=${item.episode}`
      : `/watch/${item.type}/${item.id}`;

  const progressMins = item.progressSeconds ? Math.floor(item.progressSeconds / 60) : 0;
  const durationMins = item.durationSeconds ? Math.floor(item.durationSeconds / 60) : 0;
  const remainingMins = durationMins > 0 ? Math.max(0, durationMins - progressMins) : 0;
  const progressLabel = durationMins > 0 ? `${formatRuntime(remainingMins) || '<1m'} left` : '';

  // Muted trailer teaser on hover — mouse devices only, never on touch / reduced motion
  const handleMouseEnter = () => {
    if (!canHover() || prefersReducedMotion()) return;
    isHoveredRef.current = true;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(async () => {
      const key = await getTrailerKey(item.type, item.id).catch(() => null);
      if (isHoveredRef.current) setTrailerKey(key);
    }, 400);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsTrailerReady(false);
    setTrailerKey(null);
  };

  useEffect(() => {
    return () => {
      isHoveredRef.current = false;
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group/item relative w-[280px] sm:w-[320px] md:w-[350px] flex-shrink-0 snap-start rounded-3xl overflow-hidden bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 shadow-2xl hover:-translate-y-1.5 flex flex-col"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        {trailerKey && (
          <div
            className={cn(
              'relative w-full h-full overflow-hidden scale-135 pointer-events-none transition-opacity duration-700',
              isTrailerReady ? 'opacity-100' : 'opacity-0'
            )}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=${trailerKey}&playsinline=1&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`}
              title={`${item.title} teaser`}
              tabIndex={-1}
              aria-hidden="true"
              onLoad={() => setTimeout(() => isHoveredRef.current && setIsTrailerReady(true), 700)}
              allow="autoplay; encrypted-media"
              className="w-full h-full border-0 pointer-events-none"
            />
          </div>
        )}

        <Image
          src={
            backdropError
              ? getPosterUrl(item.poster_path, 'w500')
              : getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')
          }
          alt=""
          fill
          sizes="(max-width: 640px) 280px, 350px"
          onError={() => setBackdropError(true)}
          className={cn(
            'object-cover group-hover/item:scale-105 transition-all duration-500 brightness-90',
            isTrailerReady && trailerKey ? 'opacity-0' : 'opacity-100'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />

        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item);
            }}
            aria-label={`Remove ${item.title} from Continue Watching`}
            className="p-2 rounded-full bg-black/70 hover:bg-accent text-zinc-200 hover:text-white backdrop-blur-md border border-white/10 transition-colors shadow-lg"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Link
              href={playUrl}
              className="w-10 h-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
              aria-label={`Resume ${item.title}`}
            >
              <Play className="w-4 h-4 fill-black ml-0.5" aria-hidden="true" />
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
          {progressLabel && (
            <span className="text-xs font-bold text-zinc-200 bg-black/70 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
              {progressLabel}
            </span>
          )}
        </div>

        {item.progressPercent ? (
          <div
            className="absolute bottom-0 inset-x-0 z-10 h-1.5 bg-black/70 overflow-hidden pointer-events-none"
            role="progressbar"
            aria-label="Watch progress"
            aria-valuenow={item.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-accent shadow-[0_0_10px_rgba(229,9,20,0.9)]"
              style={{ width: `${Math.min(100, Math.max(3, item.progressPercent))}%` }}
            />
          </div>
        ) : null}
      </div>

      <Link href={detailsUrl} className="p-4 flex flex-col gap-1 bg-black/30">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-black text-sm sm:text-base text-zinc-100 truncate group-hover/item:text-red-400 transition-colors">
            {item.title}
          </h3>
          <span className="text-xs text-zinc-400 font-semibold flex-shrink-0">
            {formatRelativeTime(item.lastWatchedAt)}
          </span>
        </div>
        {item.type === 'tv' && item.season && item.episode ? (
          <p className="text-xs text-red-400 font-bold line-clamp-1">
            Season {item.season}, Episode {item.episode}
            {item.episodeTitle ? ` • ${item.episodeTitle}` : ''}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 font-medium">
            Movie{durationMins ? ` • ${formatRuntime(durationMins)}` : ''}
          </p>
        )}
      </Link>
    </div>
  );
}

export function ContinueWatchingRow() {
  const history = useUserStoreSelector((s) => s.history);
  // Finished movies drop out of the row; series stay so the next episode is one tap away
  const items = useMemo(
    () => history.filter((h) => !(h.type === 'movie' && h.finished)).slice(0, 15),
    [history]
  );

  const handleRemove = (item: WatchHistoryItem) => {
    userStoreActions.removeFromHistory(item.id, item.type);
    toast(`Removed "${item.title}"`, {
      tone: 'info',
      action: { label: 'Undo', onClick: () => userStoreActions.restoreHistoryItem(item) },
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="relative w-full py-6" aria-labelledby="continue-watching-heading">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <History className="w-6 h-6 text-accent" aria-hidden="true" />
          <h2 id="continue-watching-heading" className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Continue Watching
          </h2>
        </div>
        <Link
          href="/watchlist?tab=history"
          className="text-xs md:text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          View all history →
        </Link>
      </div>

      <ScrollRow label="Continue Watching" trackClassName="gap-5 py-3 px-1">
        {items.map((item) => (
          <ContinueWatchingCard key={`${item.type}-${item.id}`} item={item} onRemove={handleRemove} />
        ))}
      </ScrollRow>
    </section>
  );
}
