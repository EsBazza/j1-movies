'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Info, Share2, Star } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb';
import { TRAILER_FADE, useBackgroundTrailer } from '@/lib/youtube';
import { useUserStoreSelector, userStoreActions } from '@/lib/store';
import { toast } from '@/components/ui/Toast';
import { formatYear, cn } from '@/lib/utils';

interface ReelItemProps {
  item: NormalizedMedia;
  trailerKey: string | null;
  isActive: boolean;
  index: number;
  onEnded: () => void;
}

const DOUBLE_TAP_MS = 280;

export function ReelItem({ item, trailerKey, isActive, index, onEnded }: ReelItemProps) {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaved = useUserStoreSelector((s) => s.watchlist.some((w) => w.id === item.id && w.type === item.type));

  const { observeContainer, attachIframe, iframeProps, isPlaying, togglePause } =
    useBackgroundTrailer({ videoKey: trailerKey, enabled: isActive, loop: false, onEnded });

  const watchlistItem = {
    id: item.id,
    type: item.type,
    title: item.title,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    vote_average: item.rating,
    release_date: item.releaseDate,
  };

  const save = () => {
    if (!isSaved) {
      userStoreActions.addToWatchlist(watchlistItem);
      toast(`Added "${item.title}" to My List`);
    }
  };

  const toggleSave = () => {
    if (isSaved) {
      userStoreActions.removeFromWatchlist(item.id, item.type);
      toast(`Removed "${item.title}" from My List`, {
        tone: 'info',
        action: { label: 'Undo', onClick: () => userStoreActions.addToWatchlist(watchlistItem) },
      });
    } else save();
  };

  // Single tap pauses/resumes; double tap saves to My List with a heart burst
  const onTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      lastTapRef.current = 0;
      const heart = { id: now, x: e.clientX - rect.left, y: e.clientY - rect.top };
      setHearts((h) => [...h, heart]);
      setTimeout(() => setHearts((h) => h.filter((x) => x.id !== heart.id)), 750);
      save();
      return;
    }
    lastTapRef.current = now;
    singleTapTimer.current = setTimeout(togglePause, DOUBLE_TAP_MS);
  };

  const share = async () => {
    const url = `${window.location.origin}/details/${item.type}/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch {
      // share sheet dismissed
    }
  };

  const showVideo = Boolean(iframeProps) && isPlaying;
  const detailsHref = `/details/${item.type}/${item.id}`;

  return (
    <section
      ref={observeContainer}
      data-reel-index={index}
      aria-roledescription="reel"
      aria-label={item.title}
      className="relative h-[100svh] w-full snap-start snap-always overflow-hidden bg-black"
    >
      {/* Dimmed artwork behind the 16:9 trailer (fills portrait screens without heavy blur) */}
      <Image
        src={getPosterUrl(item.posterPath, 'w780')}
        alt=""
        fill
        sizes="100vw"
        priority={index < 2}
        className="object-cover opacity-35 scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 lg:top-0 lg:translate-y-0 lg:inset-y-0 flex items-center justify-center">
        <div className="relative w-full lg:w-auto lg:h-full aspect-video max-h-full">
          <Image
            src={getBackdropUrl(item.backdropPath || item.posterPath, 'w1280')}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
          {isActive && iframeProps && (
            <iframe
              ref={attachIframe}
              {...iframeProps}
              className={cn(
                'absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.02]',
                TRAILER_FADE.base,
                showVideo ? TRAILER_FADE.in : TRAILER_FADE.out
              )}
            />
          )}
        </div>
      </div>

      {/* Tap layer: pause / double-tap to save */}
      <div className="absolute inset-0 z-10 touch-manipulation select-none" onPointerUp={onTap} aria-hidden="true">
        {hearts.map((h) => (
          <Heart
            key={h.id}
            className="absolute w-24 h-24 -ml-12 -mt-12 fill-accent text-accent animate-heart-pop pointer-events-none"
            style={{ left: h.x, top: h.y }}
          />
        ))}
      </div>

      {/* Info */}
      <div className="absolute z-20 left-0 right-20 bottom-0 px-4 sm:px-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-12 pointer-events-none">
        <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">{item.title}</h2>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-zinc-200 mt-1">
          {item.rating > 0 && (
            <span className="flex items-center gap-1 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {item.rating}
            </span>
          )}
          {item.releaseDate && <span>{formatYear(item.releaseDate)}</span>}
          <span>{item.type === 'movie' ? 'Movie' : 'Series'}</span>
        </p>
        {item.overview && <p className="text-sm text-zinc-300 mt-2 line-clamp-2 max-w-xl">{item.overview}</p>}
        <Link
          href={detailsHref}
          className="pointer-events-auto mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-accent text-on-accent text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Info className="w-4 h-4" aria-hidden="true" />
          View details
        </Link>
      </div>

      {/* Actions */}
      <div className="absolute z-20 right-3 sm:right-6 bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:bottom-12 flex flex-col items-center gap-5">
        {[
          {
            label: isSaved ? 'Saved' : 'Save',
            aria: isSaved ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`,
            onClick: toggleSave,
            pressed: isSaved,
            icon: <Heart className={cn('w-6 h-6', isSaved && 'fill-accent text-accent')} aria-hidden="true" />,
          },
          {
            label: 'Share',
            aria: `Share ${item.title}`,
            onClick: share,
            pressed: undefined,
            icon: <Share2 className="w-6 h-6" aria-hidden="true" />,
          },
        ].map((a) => (
          <button
            key={a.label + a.aria}
            type="button"
            onClick={a.onClick}
            aria-label={a.aria}
            aria-pressed={a.pressed}
            className="flex flex-col items-center gap-1 text-white"
          >
            <span className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-90">
              {a.icon}
            </span>
            <span className="text-[11px] font-medium drop-shadow" aria-hidden="true">
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
