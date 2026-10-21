'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Star, Info, Volume1, Volume2, VolumeX } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl, getLogoUrl, getMovieDetails, getTVDetails, pickLogo } from '@/lib/tmdb';
import { formatYear, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ExtractedPalette, DEFAULT_PALETTE } from '@/lib/colorExtractor';
import { getBackgroundTrailerUrl, useAutoplayAllowed, ytCommand, ytSetVolume } from '@/lib/youtube';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useUserStoreSelector } from '@/lib/store';

interface HeroBannerProps {
  item?: NormalizedMedia;
  items?: NormalizedMedia[];
  palette?: ExtractedPalette;
  onActiveItemChange?: (item: NormalizedMedia) => void;
  /** Page-level heading for screen readers (the hero title itself is an h2) */
  pageTitle?: string;
}

const ROTATION_DURATION_MS = 14000;
const SWIPE_THRESHOLD_PX = 50;

function pickTrailerKey(videos: { site?: string; type?: string; key?: string }[] = []): string | null {
  const yt = videos.filter((v) => v.site === 'YouTube');
  const trailer =
    yt.find((v) => v.type === 'Trailer') || yt.find((v) => v.type === 'Teaser') || yt.find((v) => v.type === 'Clip') || yt[0];
  return trailer?.key || null;
}

export function HeroBanner({
  item,
  items = [],
  palette = DEFAULT_PALETTE,
  onActiveItemChange,
  pageTitle = 'J1 Movies',
}: HeroBannerProps) {
  const featuredList = useMemo(() => {
    if (items.length > 0) return items.slice(0, 8);
    if (item) return [item];
    return [];
  }, [items, item]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const currentItem = featuredList[currentIndex] || item;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastEmittedIdRef = useRef<number | null>(null);
  const remainingRef = useRef(ROTATION_DURATION_MS);
  const swipeStartRef = useRef<number | null>(null);

  const [media, setMedia] = useState<{ id: number; logoPath: string | null; trailerKey: string | null } | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const [isTrailerLoaded, setIsTrailerLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState<number>(80);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const autoplayAllowed = useAutoplayAllowed();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // Background trailers are desktop-only and respect reduced-motion / data-saver
  const trailersEnabled = autoplayAllowed && isDesktop;

  // Logo/trailer belong to a specific item id, so a stale value is never shown for a new slide
  const currentMedia = media && currentItem && media.id === currentItem.id ? media : null;
  const logoPath = currentMedia?.logoPath ?? null;
  const trailerKey = trailersEnabled ? currentMedia?.trailerKey ?? null : null;

  const isPaused = isHoverPaused || isUserPaused || isTabHidden;
  const canRotate = featuredList.length > 1 && autoplayAllowed;

  const historyItem = useUserStoreSelector((s) =>
    currentItem ? s.history.find((h) => h.id === currentItem.id && h.type === currentItem.type) : undefined
  );

  const goTo = useCallback(
    (idx: number) => {
      const count = featuredList.length;
      if (count === 0) return;
      setCurrentIndex(((idx % count) + count) % count);
      setIsTrailerLoaded(false);
      setLogoFailed(false);
      setBackdropError(false);
    },
    [featuredList.length]
  );

  // Pause rotation while the tab is in the background
  useEffect(() => {
    const onVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Rotation timer that survives pauses (keeps the remaining time instead of restarting)
  useEffect(() => {
    remainingRef.current = ROTATION_DURATION_MS;
  }, [currentIndex]);

  useEffect(() => {
    if (!canRotate || isPaused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => goTo(currentIndex + 1), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [canRotate, isPaused, currentIndex, goTo]);

  // Inform the parent only when the active id actually changes
  useEffect(() => {
    const active = featuredList[currentIndex];
    if (active && active.id !== lastEmittedIdRef.current) {
      lastEmittedIdRef.current = active.id;
      onActiveItemChange?.(active);
    }
  }, [currentIndex, featuredList, onActiveItemChange]);

  // Load logo + trailer for the active item (one request: details include videos & images)
  useEffect(() => {
    if (!currentItem) return;
    let ignore = false;
    const { id, type } = currentItem;
    (type === 'movie' ? getMovieDetails(id) : getTVDetails(id))
      .then((details) => {
        if (ignore) return;
        setMedia({
          id,
          logoPath: pickLogo(details.images?.logos)?.file_path || null,
          trailerKey: pickTrailerKey(details.videos?.results),
        });
      })
      .catch(() => {
        if (!ignore) setMedia({ id, logoPath: null, trailerKey: null });
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id, currentItem?.type]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    ytSetVolume(iframeRef.current, nextMuted ? 0 : volume || 80);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    ytSetVolume(iframeRef.current, newVolume);
  };

  const toggleUserPause = () => {
    const next = !isUserPaused;
    setIsUserPaused(next);
    ytCommand(iframeRef.current, next ? 'pauseVideo' : 'playVideo');
  };

  if (!currentItem) return null;

  const detailsHref = `/details/${currentItem.type}/${currentItem.id}`;
  const playHref =
    currentItem.type === 'tv'
      ? `/watch/tv/${currentItem.id}?season=${historyItem?.season || 1}&episode=${historyItem?.episode || 1}`
      : `/watch/movie/${currentItem.id}`;
  const showTrailer = Boolean(trailerKey) && isTrailerLoaded;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setIsHoverPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setIsHoverPaused(false)}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') swipeStartRef.current = e.clientX;
      }}
      onPointerUp={(e) => {
        const start = swipeStartRef.current;
        swipeStartRef.current = null;
        if (start === null || featuredList.length < 2) return;
        const dx = e.clientX - start;
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX) goTo(currentIndex + (dx < 0 ? 1 : -1));
      }}
      className="relative w-full min-h-[560px] sm:min-h-[740px] lg:min-h-[860px] overflow-hidden flex flex-col justify-end z-10 touch-pan-y"
    >
      <h1 className="sr-only">{pageTitle}</h1>

      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] rounded-full filter blur-[90px] opacity-80 pointer-events-none -z-0 transition-all duration-1000"
        style={{ backgroundColor: palette.primaryGlow }}
      />

      {/* Background image / trailer with a soft bottom dissolve */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0 overflow-hidden pointer-events-none select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0) 96%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0) 96%)',
        }}
      >
        {trailerKey && (
          <div
            className={cn(
              'absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000',
              isTrailerLoaded ? 'opacity-95' : 'opacity-0'
            )}
          >
            <iframe
              ref={iframeRef}
              key={`hero-trailer-${currentItem.id}-${trailerKey}`}
              src={getBackgroundTrailerUrl(trailerKey)}
              title="Background trailer"
              tabIndex={-1}
              onLoad={() => {
                // Every new embed starts muted; re-apply the user's audio choice
                if (!isMuted) ytSetVolume(iframeRef.current, volume);
                if (isUserPaused) ytCommand(iframeRef.current, 'pauseVideo');
                setTimeout(() => setIsTrailerLoaded(true), 800);
              }}
              allow="autoplay; encrypted-media"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] max-w-none max-h-none border-0 pointer-events-none"
            />
          </div>
        )}

        <Image
          key={`hero-backdrop-${currentItem.id}-${backdropError ? 'poster' : 'backdrop'}`}
          src={
            backdropError
              ? getPosterUrl(currentItem.posterPath, 'w780')
              : getBackdropUrl(currentItem.backdropPath || currentItem.posterPath, 'w1280')
          }
          alt=""
          fill
          priority={currentIndex === 0}
          sizes="100vw"
          onError={() => setBackdropError(true)}
          className={cn(
            'object-cover object-top brightness-95 contrast-105 scale-105 transition-opacity duration-1000 animate-fade-in',
            showTrailer ? 'opacity-0' : 'opacity-100'
          )}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-[1750px] mx-auto w-full px-4 sm:px-10 lg:px-16 xl:px-20 flex flex-col justify-end pb-14 md:pb-24 z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8">
          <div
            key={currentItem.id}
            className="max-w-2xl flex flex-col gap-4 animate-fade-in"
            role="group"
            aria-roledescription="slide"
            aria-label={`${currentIndex + 1} of ${featuredList.length}: ${currentItem.title}`}
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-zinc-200 flex-wrap">
              {currentItem.rating > 0 && (
                <span className="flex items-center gap-1.5 text-white">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span>
                    <span className="sr-only">Rated </span>
                    {currentItem.rating}/10
                  </span>
                </span>
              )}
              {currentItem.releaseDate && (
                <>
                  <span className="text-zinc-400" aria-hidden="true">•</span>
                  <span>{formatYear(currentItem.releaseDate)}</span>
                </>
              )}
              <span className="text-zinc-400" aria-hidden="true">•</span>
              <span>{currentItem.genres?.[0]?.name || (currentItem.type === 'movie' ? 'Movie' : 'TV Series')}</span>
            </div>

            {logoPath && !logoFailed ? (
              <>
                <h2 className="sr-only">{currentItem.title}</h2>
                <div className="relative w-full max-w-[280px] sm:max-w-[420px] md:max-w-[540px] h-20 sm:h-28 md:h-36 my-1">
                  <Image
                    key={`hero-logo-${currentItem.id}`}
                    src={getLogoUrl(logoPath, 'w500')}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 280px, 540px"
                    onError={() => setLogoFailed(true)}
                    className="object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)]"
                  />
                </div>
              </>
            ) : (
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-[1.05]">
                {currentItem.title}
              </h2>
            )}

            {currentItem.overview && (
              <p className="text-sm sm:text-base text-zinc-100 line-clamp-3 leading-relaxed drop-shadow-lg max-w-xl">
                {currentItem.overview}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <Link
                href={playHref}
                className="flex items-center gap-2.5 px-7 sm:px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-2xl transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black ml-0.5" aria-hidden="true" />
                <span>{historyItem && !historyItem.finished ? 'Resume' : 'Play'}</span>
                <span className="sr-only"> {currentItem.title}</span>
              </Link>

              <Link
                href={detailsHref}
                className="flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 backdrop-blur-xl transition-colors"
              >
                <Info className="w-4 h-4" aria-hidden="true" />
                <span>More Info</span>
                <span className="sr-only"> about {currentItem.title}</span>
              </Link>

              <BookmarkButton
                item={{
                  id: currentItem.id,
                  type: currentItem.type,
                  title: currentItem.title,
                  poster_path: currentItem.posterPath,
                  backdrop_path: currentItem.backdropPath,
                  vote_average: currentItem.rating,
                  release_date: currentItem.releaseDate,
                }}
                variant="icon"
                className="p-3"
              />

              {trailerKey && (
                <div
                  className={cn(
                    'flex items-center h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 backdrop-blur-xl transition-all duration-300 shadow-lg',
                    showVolumeSlider ? 'w-48 gap-2.5 px-3.5' : 'w-12 justify-center'
                  )}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  onFocus={() => setShowVolumeSlider(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setShowVolumeSlider(false);
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                    aria-pressed={!isMuted}
                    className="flex items-center justify-center text-white hover:scale-110 transition-transform flex-shrink-0"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-zinc-300" aria-hidden="true" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                  {showVolumeSlider && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      aria-label="Trailer volume"
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Slide controls: always-visible pause + dots with progress */}
          {featuredList.length > 1 && (
            <div className="flex items-center gap-2 pb-2 self-start lg:self-end">
              {canRotate && (
                <button
                  type="button"
                  onClick={toggleUserPause}
                  aria-label={isUserPaused ? 'Resume slideshow' : 'Pause slideshow'}
                  className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  {isUserPaused ? (
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" aria-hidden="true" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg">
                {featuredList.map((fItem, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={`${fItem.type}-${fItem.id}`}
                      type="button"
                      onClick={() => goTo(idx)}
                      aria-label={`Show slide ${idx + 1}: ${fItem.title}`}
                      aria-current={isActive ? 'true' : undefined}
                      className="p-1.5 -m-0.5 rounded-full"
                    >
                      <span
                        className={cn(
                          'block h-1.5 rounded-full overflow-hidden transition-all duration-300',
                          isActive ? 'w-7 bg-white/30' : 'w-1.5 bg-white/50 hover:bg-white/80'
                        )}
                      >
                        {isActive && (
                          <span
                            key={`progress-${currentIndex}`}
                            className={cn('block h-full w-full bg-white rounded-full', canRotate && 'hero-progress')}
                            data-paused={isPaused}
                            style={{ '--hero-duration': `${ROTATION_DURATION_MS}ms` } as React.CSSProperties}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
