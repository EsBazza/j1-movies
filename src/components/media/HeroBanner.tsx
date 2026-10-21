'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Play, Pause, Star } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl, getLogoUrl, getMovieDetails, getTVDetails, pickLogo } from '@/lib/tmdb';
import { formatYear, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { LinkButton, IconButton } from '@/components/ui/Button';
import { VolumeControl } from '@/components/ui/VolumeControl';
import { ExtractedPalette } from '@/lib/colorExtractor';
import { TRAILER_FADE, useAutoplayAllowed, useBackgroundTrailer } from '@/lib/youtube';
import { useUserStoreSelector } from '@/lib/store';
import { useTrailerPalette } from '@/lib/palette';

interface HeroBannerProps {
  item?: NormalizedMedia;
  items?: NormalizedMedia[];
  /** The page's palette for the active slide; restored when the trailer isn't playing */
  palette?: ExtractedPalette;
  onActiveItemChange?: (item: NormalizedMedia) => void;
  /** Page-level heading for screen readers (the hero title itself is an h2) */
  pageTitle?: string;
}

interface SlideMedia {
  id: number;
  logoPath: string | null;
  trailerKey: string | null;
  genres: string[];
}

const ROTATION_MS = 12000;
// While a trailer plays, give it longer before moving on (it also advances when it ends)
const ROTATION_WITH_TRAILER_MS = 45000;
const SWIPE_THRESHOLD_PX = 50;

function pickTrailerKey(videos: { site?: string; type?: string; key?: string }[] = []): string | null {
  const yt = videos.filter((v) => v.site === 'YouTube');
  const trailer = yt.find((v) => v.type === 'Trailer') || yt.find((v) => v.type === 'Teaser') || yt[0];
  return trailer?.key || null;
}

export function HeroBanner({ item, items = [], palette, onActiveItemChange, pageTitle = 'J1 Movies' }: HeroBannerProps) {
  const slides = useMemo(() => {
    if (items.length > 0) return items.slice(0, 6);
    return item ? [item] : [];
  }, [items, item]);

  const [index, setIndex] = useState(0);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [mediaById, setMediaById] = useState<Record<number, SlideMedia>>({});
  const [logoFailed, setLogoFailed] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const remainingRef = useRef(ROTATION_MS);
  const swipeStartRef = useRef<number | null>(null);
  const lastEmittedIdRef = useRef<number | null>(null);

  const current = slides[index] || item;
  const media = current ? mediaById[current.id] : undefined;
  const autoplayAllowed = useAutoplayAllowed();
  const canRotate = slides.length > 1 && autoplayAllowed;

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setIndex(((next % slides.length) + slides.length) % slides.length);
      setLogoFailed(false);
      setBackdropError(false);
    },
    [slides.length]
  );

  const {
    observeContainer,
    attachIframe,
    iframeProps: trailerIframeProps,
    isPlaying: trailerPlaying,
    isPaused: userPaused,
    togglePause,
  } = useBackgroundTrailer({
    videoKey: media?.trailerKey ?? null,
    enabled: autoplayAllowed,
    loop: false,
    onEnded: () => canRotate && goTo(index + 1),
  });

  // Ambient colours follow the trailer while it plays
  useTrailerPalette(media?.trailerKey ?? null, trailerPlaying, palette);

  const isPaused = isHoverPaused || userPaused;
  const slideDuration = trailerPlaying ? ROTATION_WITH_TRAILER_MS : ROTATION_MS;

  // Rotation timer that keeps the remaining time across pauses
  useEffect(() => {
    remainingRef.current = slideDuration;
  }, [index, slideDuration]);

  useEffect(() => {
    if (!canRotate || isPaused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => goTo(index + 1), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [canRotate, isPaused, index, slideDuration, goTo]);

  useEffect(() => {
    if (current && current.id !== lastEmittedIdRef.current) {
      lastEmittedIdRef.current = current.id;
      onActiveItemChange?.(current);
    }
  }, [current, onActiveItemChange]);

  // Logo, trailer and genre names for the active slide (cached per id)
  useEffect(() => {
    if (!current || mediaById[current.id]) return;
    let ignore = false;
    const { id, type } = current;
    (type === 'movie' ? getMovieDetails(id) : getTVDetails(id))
      .then((d) => {
        if (ignore) return;
        setMediaById((prev) => ({
          ...prev,
          [id]: {
            id,
            logoPath: pickLogo(d.images?.logos)?.file_path || null,
            trailerKey: pickTrailerKey(d.videos?.results),
            genres: (d.genres || []).slice(0, 3).map((g) => g.name),
          },
        }));
      })
      .catch(() => {
        if (!ignore) setMediaById((prev) => ({ ...prev, [id]: { id, logoPath: null, trailerKey: null, genres: [] } }));
      });
    return () => {
      ignore = true;
    };
  }, [current, mediaById]);

  const historyItem = useUserStoreSelector((s) =>
    current ? s.history.find((h) => h.id === current.id && h.type === current.type) : undefined
  );

  if (!current) return null;

  const detailsHref = `/details/${current.type}/${current.id}`;
  const showTrailer = Boolean(trailerIframeProps) && trailerPlaying;

  return (
    <section
      ref={observeContainer}
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
        if (start === null || slides.length < 2) return;
        const dx = e.clientX - start;
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX) goTo(index + (dx < 0 ? 1 : -1));
      }}
      className="relative w-full h-[78svh] min-h-[520px] max-h-[980px] sm:h-[88vh] overflow-hidden touch-pan-y"
    >
      <h1 className="sr-only">{pageTitle}</h1>

      {/* Media */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden fade-bottom">
        <Image
          key={`${current.id}-${backdropError ? 'poster' : 'backdrop'}`}
          src={
            backdropError
              ? getPosterUrl(current.posterPath, 'w780')
              : getBackdropUrl(current.backdropPath || current.posterPath, 'w1280')
          }
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          onError={() => setBackdropError(true)}
          className={cn(
            'object-cover object-[center_20%] animate-fade-in'
          )}
        />
        {trailerIframeProps && (
          <iframe
            key={`${current.id}-${media?.trailerKey}`}
            ref={attachIframe}
            {...trailerIframeProps}
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none',
              TRAILER_FADE.base,
              // Cover the frame at any aspect ratio and crop YouTube's letterboxing
              'w-[max(100%,177.78vh)] h-[max(100%,56.25vw)] scale-[1.18]',
              showTrailer ? TRAILER_FADE.in : TRAILER_FADE.out
            )}
          />
        )}
        {/* Media fades to transparent (mask), so the ambient background continues below
            without a visible edge; a soft blur band smooths the transition */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 blur-band" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 flex flex-col justify-end pb-16 sm:pb-20 lg:pb-24">
        <div
          key={current.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}: ${current.title}`}
          className="max-w-xl lg:max-w-2xl animate-slide-up"
        >
          {media?.logoPath && !logoFailed ? (
            <>
              <h2 className="sr-only">{current.title}</h2>
              <div className="relative w-[min(78vw,460px)] h-24 sm:h-32 lg:h-40 mb-4">
                <Image
                  src={getLogoUrl(media.logoPath, 'w500')}
                  alt=""
                  fill
                  sizes="460px"
                  onError={() => setLogoFailed(true)}
                  className="object-contain object-left-bottom drop-shadow-[0_6px_24px_rgba(0,0,0,0.7)]"
                />
              </div>
            </>
          ) : (
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.02] mb-4">{current.title}</h2>
          )}

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-200">
            {current.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-white">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="sr-only">Rated </span>
                {current.rating}
              </span>
            )}
            {current.releaseDate && <span>{formatYear(current.releaseDate)}</span>}
            <span>{current.type === 'movie' ? 'Movie' : 'Series'}</span>
            {media?.genres.map((g) => (
              <span key={g} className="text-zinc-400">
                {g}
              </span>
            ))}
          </p>

          {current.overview && (
            <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
              {current.overview}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <LinkButton href={detailsHref} size="lg">
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              {historyItem && !historyItem.finished ? 'Resume' : 'Play'}
              <span className="sr-only"> {current.title}</span>
            </LinkButton>
            <BookmarkButton
              item={{
                id: current.id,
                type: current.type,
                title: current.title,
                poster_path: current.posterPath,
                backdrop_path: current.backdropPath,
                vote_average: current.rating,
                release_date: current.releaseDate,
              }}
              className="w-12 h-12 p-0 inline-flex items-center justify-center"
            />
            {trailerIframeProps && <VolumeControl />}
          </div>
        </div>

        {/* Slide controls */}
        {slides.length > 1 && (
          <div className="mt-8 flex items-end gap-3 lg:absolute lg:right-16 lg:bottom-24 lg:mt-0">
            {canRotate && (
              <IconButton
                aria-label={userPaused ? 'Resume slideshow' : 'Pause slideshow'}
                size="sm"
                onClick={togglePause}
              >
                {userPaused ? <Play className="w-4 h-4 fill-current" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
              </IconButton>
            )}
            <div className="flex flex-1 lg:flex-none items-end gap-2">
              {slides.map((slide, i) => {
                const active = i === index;
                return (
                  <button
                    key={`${slide.type}-${slide.id}`}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show ${slide.title}`}
                    aria-current={active ? 'true' : undefined}
                    className="group flex-1 lg:flex-none flex flex-col gap-1.5 py-2"
                  >
                    {/* Thumbnails on large screens */}
                    <span
                      className={cn(
                        'hidden lg:block relative w-28 aspect-video rounded-md overflow-hidden transition-[opacity,transform] duration-300',
                        active ? 'opacity-100 -translate-y-1' : 'opacity-50 group-hover:opacity-90'
                      )}
                    >
                      <Image
                        src={getBackdropUrl(slide.backdropPath || slide.posterPath, 'w780')}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </span>
                    <span className="block h-[3px] w-full rounded-full bg-white/20 overflow-hidden">
                      {active ? (
                        <span
                          key={`progress-${index}-${slideDuration}`}
                          className={cn('block h-full w-full bg-white', canRotate && 'hero-progress')}
                          data-paused={isPaused}
                          style={{ '--hero-duration': `${slideDuration}ms` } as React.CSSProperties}
                        />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
