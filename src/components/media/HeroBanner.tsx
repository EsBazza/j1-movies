'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Pause,
  Star,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import {
  getBackdropUrl,
  getLogoUrl,
  getMovieDetails,
  getTVDetails,
  getMediaVideos,
} from '@/lib/tmdb';
import { formatYear, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ExtractedPalette, DEFAULT_PALETTE } from '@/lib/colorExtractor';

interface HeroBannerProps {
  item?: NormalizedMedia;
  items?: NormalizedMedia[];
  palette?: ExtractedPalette;
  onActiveItemChange?: (item: NormalizedMedia) => void;
}

const ROTATION_DURATION_MS = 14000; // 14 seconds per featured trailer

export function HeroBanner({
  item,
  items = [],
  palette = DEFAULT_PALETTE,
  onActiveItemChange,
}: HeroBannerProps) {
  const featuredList = useMemo(() => {
    if (items.length > 0) return items.slice(0, 8);
    if (item) return [item];
    return [];
  }, [items, item]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentItem = featuredList[currentIndex] || item;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastEmittedIdRef = useRef<number | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isTrailerLoaded, setIsTrailerLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState<number>(80);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Auto-advance Timer Carousel
  useEffect(() => {
    if (featuredList.length <= 1 || isPaused) return;

    const intervalTime = 100;
    const step = (intervalTime / ROTATION_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [featuredList.length, isPaused, currentIndex]);

  // Advance index when timer progress completes
  useEffect(() => {
    if (progress >= 100 && featuredList.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
      setProgress(0);
      setIsTrailerLoaded(false);
      setIsPlaying(true);
    }
  }, [progress, featuredList.length]);

  // Safely inform parent of current active item ONLY when item ID actually changes
  useEffect(() => {
    const active = featuredList[currentIndex];
    if (active && active.id !== lastEmittedIdRef.current) {
      lastEmittedIdRef.current = active.id;
      onActiveItemChange?.(active);
    }
  }, [currentIndex, featuredList, onActiveItemChange]);

  const selectIndex = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
    setIsTrailerLoaded(false);
    setIsPlaying(true);
  };

  // Play / Pause Toggle
  const togglePlayPause = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextPlaying ? 'playVideo' : 'pauseVideo',
          args: [],
        }),
        '*'
      );
    }
  };

  // Audio Toggle & Volume Control
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: [],
        }),
        '*'
      );
      if (!nextMuted) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [volume || 80],
          }),
          '*'
        );
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'mute',
            args: [],
          }),
          '*'
        );
      }
    } else {
      if (isMuted) setIsMuted(false);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'unMute',
            args: [],
          }),
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [newVolume],
          }),
          '*'
        );
      }
    }
  };

  // Load active item's Logo & Trailer
  useEffect(() => {
    if (!currentItem) return;
    let isMounted = true;
    setIsTrailerLoaded(false);
    setIsPlaying(true);

    async function loadHeroMedia() {
      if (!currentItem) return;
      try {
        const [details, videoRes] = await Promise.all([
          currentItem.type === 'movie'
            ? getMovieDetails(currentItem.id)
            : getTVDetails(currentItem.id),
          getMediaVideos(currentItem.type, currentItem.id).catch(() => null),
        ]);

        if (!isMounted) return;

        // Extract official logo
        const logo =
          details.images?.logos?.find((l) => l.iso_639_1 === 'en' && l.file_path?.endsWith('.png')) ||
          details.images?.logos?.find((l) => l.iso_639_1 === 'en') ||
          details.images?.logos?.find((l) => l.file_path?.endsWith('.png')) ||
          details.images?.logos?.[0];

        setLogoPath(logo?.file_path || null);

        // Extract official trailer
        const videos = (videoRes?.results || []).filter((v) => v.site === 'YouTube');
        const trailer =
          videos.find((v) => v.type === 'Trailer') ||
          videos.find((v) => v.type === 'Teaser') ||
          videos.find((v) => v.type === 'Clip') ||
          videos[0];

        setTrailerKey(trailer?.key || null);
      } catch {
        if (isMounted) {
          setLogoPath(null);
          setTrailerKey(null);
        }
      }
    }

    loadHeroMedia();
    return () => {
      isMounted = false;
    };
  }, [currentItem?.id, currentItem?.type]);

  if (!currentItem) return null;

  const detailsHref = `/details/${currentItem.type}/${currentItem.id}`;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-[740px] sm:min-h-[840px] lg:min-h-[920px] overflow-hidden flex flex-col justify-end z-10"
    >
      {/* Radiant Ambient Video Ambilight Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] rounded-full filter blur-[90px] opacity-80 pointer-events-none -z-0 transition-all duration-1000"
        style={{ backgroundColor: palette.primaryGlow }}
      />

      {/* Background Image / Ambient Video Trailer Layer with Seamless Bottom Dissolve */}
      <div
        className="absolute inset-0 -z-0 overflow-hidden pointer-events-none select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0) 96%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0) 96%)',
        }}
      >
        {trailerKey ? (
          <div
            className={cn(
              'absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none transition-opacity duration-1000',
              isTrailerLoaded ? 'opacity-90 md:opacity-95' : 'opacity-0'
            )}
          >
            <iframe
              ref={iframeRef}
              key={`hero-trailer-${currentItem.id}-${trailerKey}`}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&disablekb=1&fs=0`}
              title="Hero Ambient Trailer"
              onLoad={() => {
                setTimeout(() => setIsTrailerLoaded(true), 800);
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380vw] h-[215vw] sm:w-[220vw] sm:h-[125vw] md:w-[150vw] md:h-[150vh] max-w-none max-h-none object-cover filter brightness-100 contrast-[1.02] border-0 outline-none pointer-events-none"
            />
          </div>
        ) : null}

        {/* Fallback Static Backdrop Image */}
        <Image
          key={`hero-backdrop-${currentItem.id}`}
          src={getBackdropUrl(currentItem.backdropPath || currentItem.posterPath, 'original')}
          alt={currentItem.title}
          fill
          priority
          sizes="100vw"
          className={cn(
            'object-cover object-top filter brightness-95 contrast-105 scale-105 transition-opacity duration-1000',
            isTrailerLoaded && trailerKey ? 'opacity-0' : 'opacity-100'
          )}
        />

        {/* Soft Ambient Depth Blur Blend */}
        <div
          className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />
      </div>

      {/* Hero Header Content Overlay */}
      <div className="relative h-full max-w-[1750px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col justify-end pb-16 md:pb-24 z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          {/* Left Details Column */}
          <div className="max-w-2xl flex flex-col gap-4">
            {/* Meta Tags Row: Rating, Year, Genre */}
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-zinc-300 flex-wrap">
              {currentItem.rating > 0 && (
                <span className="flex items-center gap-1.5 text-white">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{currentItem.rating}/10</span>
                </span>
              )}
              {currentItem.releaseDate && (
                <>
                  <span className="text-zinc-500">•</span>
                  <span>{formatYear(currentItem.releaseDate)}</span>
                </>
              )}
              <span className="text-zinc-500">•</span>
              <span className="capitalize text-zinc-300">
                {currentItem.genres?.[0]?.name || (currentItem.type === 'movie' ? 'Movie' : 'TV Series')}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-black text-zinc-300 border border-white/15">
                4K
              </span>
            </div>

            {/* Title: Official TMDB Graphic Logo with Text Fallback */}
            {logoPath ? (
              <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[540px] h-20 sm:h-28 md:h-36 my-1">
                <Image
                  key={`hero-logo-${currentItem.id}`}
                  src={getLogoUrl(logoPath, 'w500')}
                  alt={currentItem.title}
                  fill
                  priority
                  className="object-contain object-left filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)]"
                />
              </div>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-[1.05]">
                {currentItem.title}
              </h1>
            )}

            {/* Overview */}
            <p className="text-sm sm:text-base text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-lg max-w-xl font-normal">
              {currentItem.overview || 'Stream this top-rated title in crystal clear high definition.'}
            </p>

            {/* Action Buttons: Play/Details, Bookmark, Volume & Trailer Controls */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              {/* White Capsule View Details Button */}
              <Link
                href={detailsHref}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black ml-0.5" />
                <span>View Details</span>
              </Link>

              {/* Circle Bookmark Button */}
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
              />

              {/* Interactive Volume & Play/Pause Controller Capsule */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div
                  className={cn(
                    'flex items-center rounded-full bg-black/60 hover:bg-black/80 border border-white/15 backdrop-blur-xl transition-all duration-300 shadow-lg px-3 py-2',
                    showVolumeSlider ? 'w-56 gap-2.5' : 'w-12 h-12 justify-center p-0'
                  )}
                >
                  {/* Mute/Unmute Button */}
                  <button
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    className="flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-zinc-400" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    )}
                  </button>

                  {/* Play / Pause Trailer Toggle Button (Shown on hover) */}
                  {showVolumeSlider && trailerKey && (
                    <button
                      onClick={togglePlayPause}
                      title={isPlaying ? 'Pause Trailer' : 'Play Trailer'}
                      className="flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      )}
                    </button>
                  )}

                  {/* Volume Slider Bar */}
                  {showVolumeSlider && (
                    <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-200">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <span className="text-[11px] font-bold text-zinc-300 min-w-[24px]">
                        {isMuted ? '0' : volume}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Indicators matching Screenshot */}
          <div className="flex items-center gap-4 pb-2 self-start lg:self-end">
            {/* Indicator Dots */}
            {featuredList.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg">
                {featuredList.map((fItem, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={`${fItem.type}-${fItem.id}-${idx}`}
                      onClick={() => selectIndex(idx)}
                      title={`Featured: ${fItem.title}`}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300 cursor-pointer overflow-hidden',
                        isActive
                          ? 'w-7 bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'w-1.5 bg-white/40 hover:bg-white/70'
                      )}
                    >
                      {isActive && (
                        <div
                          className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


