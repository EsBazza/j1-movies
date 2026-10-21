'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Pause,
  Star,
  Clock,
  Calendar,
  Volume1,
  Volume2,
  VolumeX,
  Film,
  Layers,
  Sparkles,
  ChevronDown,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getTVSeason,
  getBackdropUrl,
  getPosterUrl,
  getImageUrl,
  getLogoUrl,
  normalizeUnique,
  pickLogo,
  getCertification,
  isNotFoundError,
} from '@/lib/tmdb';
import {
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBSeason,
  TMDBEpisode,
  TMDBVideo,
} from '@/types/tmdb';
import { formatRuntime, formatYear, formatEndTime, formatCurrency, formatDateFull, formatRelativeTime, cn } from '@/lib/utils';
import { extractPaletteFromImage, getPaletteForGenre, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { getBackgroundTrailerUrl, useAutoplayAllowed, ytCommand, ytSetVolume } from '@/lib/youtube';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { CastList } from '@/components/media/CastList';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { Modal } from '@/components/ui/Modal';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { useUserStoreSelector } from '@/lib/store';

export default function MediaDetailsPage() {
  const routeParams = useParams();
  const rawType = routeParams?.type as string;
  if (rawType !== 'movie' && rawType !== 'tv') notFound();
  const type: 'movie' | 'tv' = rawType;
  const id = (routeParams?.id as string) || '';

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const autoplayAllowed = useAutoplayAllowed();
  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [selectedModalVideo, setSelectedModalVideo] = useState<TMDBVideo | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState<number>(80);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isTrailerLoaded, setIsTrailerLoaded] = useState(false);
  const [isTrailerPaused, setIsTrailerPaused] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<'not-found' | 'failed' | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const historyItem = useUserStoreSelector((s) => s.history.find((h) => String(h.id) === id && h.type === type));

  // Unmute / volume / pause without reloading the YouTube trailer
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

  const toggleTrailerPlayback = () => {
    ytCommand(iframeRef.current, isTrailerPaused ? 'playVideo' : 'pauseVideo');
    setIsTrailerPaused(!isTrailerPaused);
  };

  // Load title details; reset all per-title UI state when navigating between titles
  useEffect(() => {
    if (!id) return;
    let ignore = false;

    setIsLoading(true);
    setLoadError(null);
    setDetails(null);
    setSeasonData(null);
    setIsTrailerLoaded(false);
    setIsTrailerPaused(false);
    setIsMuted(true);
    setLogoFailed(false);
    setBackdropFailed(false);
    setIsBioExpanded(false);
    setPalette(DEFAULT_PALETTE);

    (type === 'movie' ? getMovieDetails(id) : getTVDetails(id))
      .then((res) => {
        if (ignore) return;
        setDetails(res);
        const genreId = res.genres?.[0]?.id;
        if (res.backdrop_path || res.poster_path) {
          const sampleUrl = getBackdropUrl(res.backdrop_path || res.poster_path, 'w780');
          extractPaletteFromImage(sampleUrl, genreId).then((p) => !ignore && setPalette(p));
        } else if (genreId) {
          setPalette(getPaletteForGenre(genreId));
        }
        if (type === 'tv') {
          const firstSeason = (res as TMDBTVDetails).seasons?.find((s) => s.season_number > 0);
          if (firstSeason) setSelectedSeasonNum(firstSeason.season_number);
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error('Failed to load media details:', err);
        setLoadError(isNotFoundError(err) ? 'not-found' : 'failed');
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [type, id, retryKey]);

  // Load season episodes (TV); stale responses from a previous season are ignored
  useEffect(() => {
    if (type !== 'tv' || !id || !details) return;
    let ignore = false;
    setIsSeasonLoading(true);
    getTVSeason(id, selectedSeasonNum)
      .then((season) => {
        if (!ignore) setSeasonData(season);
      })
      .catch((err) => {
        if (ignore) return;
        console.error('Failed to load season:', err);
        setSeasonData(null);
      })
      .finally(() => {
        if (!ignore) setIsSeasonLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [type, id, selectedSeasonNum, details]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SkeletonBanner />
      </div>
    );
  }

  if (!details) {
    const notFoundError = loadError !== 'failed';
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 text-center px-4">
        <AlertCircle className="w-10 h-10 text-accent mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white mb-2">{notFoundError ? 'Title not found' : "Couldn't load this title"}</h1>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">
          {notFoundError
            ? 'This movie or series does not exist or was removed from TMDB.'
            : 'Something went wrong while loading. Check your connection and try again.'}
        </p>
        <div className="flex gap-3">
          {!notFoundError && (
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          )}
          <Link href="/" className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  const title =
    details.title ||
    details.name ||
    details.original_title ||
    (details as TMDBTVDetails).original_name ||
    'Untitled';
  const releaseDate = details.release_date || details.first_air_date || '';
  const runtime = (details as TMDBMovieDetails).runtime;
  const seasons = (details as TMDBTVDetails).seasons?.filter((s) => s.season_number > 0) || [];
  
  // Find Director from crew
  const director = details.credits?.crew?.find((c) => c.job === 'Director' || c.department === 'Directing');

  // YouTube Videos (Trailers, Teasers, Clips)
  const allVideos = (details.videos?.results || []).filter((v) => v.site === 'YouTube');
  const mainTrailer =
    allVideos.find((v) => v.type === 'Trailer') ||
    allVideos.find((v) => v.type === 'Teaser') ||
    allVideos[0];

  const recommendations = normalizeUnique(
    [...(details.recommendations?.results || []), ...(details.similar?.results || [])],
    type
  ).slice(0, 12);

  const certification = getCertification(details, type);
  const logo = pickLogo(details.images?.logos);
  const hasProgress = Boolean(historyItem?.progressSeconds && !historyItem.finished);
  const playTrailer = Boolean(mainTrailer && autoplayAllowed);

  const resumeHref =
    type === 'tv' && historyItem?.season && historyItem?.episode
      ? `/watch/tv/${details.id}?season=${historyItem.season}&episode=${historyItem.episode}`
      : `/watch/${type}/${details.id}`;

  const playStartHref =
    type === 'movie'
      ? `/watch/movie/${details.id}`
      : `/watch/tv/${details.id}?season=${selectedSeasonNum}&episode=1`;

  const budget = (details as TMDBMovieDetails).budget;
  const revenue = (details as TMDBMovieDetails).revenue;
  const companies = details.production_companies || [];

  return (
    <div className="w-full flex flex-col min-h-screen relative bg-transparent">
      <AmbientBackground backdropPath={details.backdrop_path} posterPath={details.poster_path} palette={palette} />

      {/* 2. Expansive Hero Section with Smooth Linear Video Dissolve */}
      <section className="relative w-full min-h-[560px] sm:min-h-[740px] lg:min-h-[860px] overflow-hidden flex flex-col justify-end z-10">
        {/* Ambient Video Ambilight Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[70vh] rounded-full filter blur-[100px] opacity-60 pointer-events-none -z-0 transition-all duration-1000"
          style={{ backgroundColor: palette.primaryGlow }}
        />

        {/* Base Movie Poster / Backdrop Image Layer (Fades out when trailer starts playing) */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full pointer-events-none -z-0 transition-opacity duration-1000",
            isTrailerLoaded && playTrailer ? "opacity-0" : "opacity-100"
          )}
          style={{
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
          }}
        >
          <Image
            src={
              backdropFailed
                ? getPosterUrl(details.poster_path, 'w780')
                : getBackdropUrl(details.backdrop_path || details.poster_path, 'w1280')
            }
            alt=""
            fill
            priority
            sizes="100vw"
            onError={() => setBackdropFailed(true)}
            className="object-cover object-top filter brightness-85"
          />
        </div>

        {/* Ambient Video Trailer Layer (Plays fully visible when loaded with zero poster bleed-through) */}
        {playTrailer && mainTrailer ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none -z-0 transition-opacity duration-1000",
              isTrailerLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
            }}
          >
            <iframe
              ref={iframeRef}
              key={`bg-trailer-${mainTrailer.key}`}
              src={getBackgroundTrailerUrl(mainTrailer.key)}
              title="Background trailer"
              tabIndex={-1}
              onLoad={() => {
                setTimeout(() => setIsTrailerLoaded(true), 600);
              }}
              allow="autoplay; encrypted-media"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380vw] h-[215vw] sm:w-[220vw] sm:h-[125vw] md:w-[150vw] md:h-[150vh] max-w-none max-h-none object-cover filter brightness-100 contrast-[1.02] border-0 outline-none pointer-events-none"
            />
          </div>
        ) : null}

        {/* Soft top gradient only for navbar separation */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent pointer-events-none z-10" />

        {/* Hero Content Overlay (Left Info + Right Stats) */}
        <div className="relative max-w-[1750px] mx-auto w-full px-4 sm:px-10 lg:px-16 xl:px-20 pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 z-20 flex flex-col lg:flex-row items-end justify-between gap-8 lg:gap-12">
          {/* Left Column: Title, Genres, Actions, Synopsis */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-5 max-w-4xl w-full">
            {/* Title: official TMDB logo with a text fallback; the h1 always exists for screen readers */}
            {logo?.file_path && !logoFailed ? (
              <>
                <h1 className="sr-only">{title}</h1>
                <div className="relative w-full max-w-[280px] sm:max-w-[460px] md:max-w-[640px] lg:max-w-[780px] h-20 sm:h-32 md:h-44 lg:h-56 my-1 sm:my-2">
                  <Image
                    src={getLogoUrl(logo.file_path, 'w500')}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 640px, 780px"
                    onError={() => setLogoFailed(true)}
                    className="object-contain object-left filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]"
                  />
                </div>
              </>
            ) : (
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight">
                {title}
              </h1>
            )}

            {/* Bulleted Genre List */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-300 flex-wrap">
                {details.genres.map((genre, idx) => (
                  <React.Fragment key={genre.id}>
                    <Link
                      href={`/genre/${genre.id}`}
                      className="hover:text-white transition-colors"
                    >
                      {genre.name}
                    </Link>
                    {idx < details.genres.length - 1 && (
                      <span className="text-zinc-600 font-bold">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Watch progress banner — only when there is real progress to show */}
            {historyItem && (hasProgress || historyItem.finished) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 border border-red-500/30 backdrop-blur-md w-fit text-xs text-zinc-300 shadow-lg flex-wrap">
                <Clock className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                {historyItem.type === 'tv' && historyItem.season && historyItem.episode ? (
                  <span className="text-red-400 font-bold">
                    S{historyItem.season} E{historyItem.episode}
                  </span>
                ) : null}
                {historyItem.finished ? (
                  <span>Watched {formatRelativeTime(historyItem.lastWatchedAt)}</span>
                ) : (
                  <span>
                    Left off at <strong className="text-red-400">{historyItem.timestampFormatted}</strong>
                  </span>
                )}
                {hasProgress && historyItem.progressPercent ? (
                  <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 text-[11px] font-extrabold border border-red-500/30">
                    {historyItem.progressPercent}%
                  </span>
                ) : null}
              </div>
            )}

            {/* Action Bar (White Capsule Play/Resume, Start from Start, Add to List, Audio Toggle) */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {/* Primary ▶ Resume or Play Button */}
              <Link
                href={resumeHref}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" aria-hidden="true" />
                <span>
                  {hasProgress
                    ? 'Resume'
                    : historyItem?.type === 'tv' && historyItem.season
                    ? `Continue S${historyItem.season} E${historyItem.episode}`
                    : 'Play'}
                </span>
              </Link>

              {/* Start over (TV: first episode of the selected season) */}
              {historyItem && (hasProgress || type === 'tv') && (
                <Link
                  href={playStartHref}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-white/10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                  <span>{type === 'tv' ? `Season ${selectedSeasonNum} from E1` : 'Start over'}</span>
                </Link>
              )}

              {/* Bookmark Button */}
              <BookmarkButton
                item={{
                  id: details.id,
                  type,
                  title,
                  poster_path: details.poster_path,
                  backdrop_path: details.backdrop_path,
                  vote_average: details.vote_average,
                  release_date: releaseDate,
                }}
                variant="icon"
              />

              {/* Background Trailer Audio, Play/Pause & Volume Controller Pill */}
              {playTrailer && (
                <div
                  className="group/vol relative flex items-center h-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xl border border-white/15 px-3.5 transition-all duration-300 shadow-xl"
                  style={{ borderColor: isVolumeOpen ? palette.primaryGlow : undefined }}
                  onMouseEnter={() => setIsVolumeOpen(true)}
                  onMouseLeave={() => setIsVolumeOpen(false)}
                  onFocus={() => setIsVolumeOpen(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsVolumeOpen(false);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleMute();
                      setIsVolumeOpen(true);
                    }}
                    aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                    aria-pressed={!isMuted}
                    className="flex items-center justify-center transition-transform hover:scale-110"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-zinc-300" aria-hidden="true" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-4 h-4" style={{ color: palette.primary }} aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4" style={{ color: palette.primary }} aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleTrailerPlayback}
                    aria-label={isTrailerPaused ? 'Play trailer' : 'Pause trailer'}
                    className="ml-2 flex items-center justify-center text-zinc-300 hover:text-white hover:scale-110 transition-transform flex-shrink-0"
                  >
                    {isTrailerPaused ? (
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>

                  {/* Expandable Smooth Volume Slider */}
                  <div
                    className={cn(
                      'flex items-center transition-all duration-300 overflow-hidden',
                      isVolumeOpen ? 'w-32 opacity-100 ml-3' : 'w-0 opacity-0 ml-0'
                    )}
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      aria-label="Trailer volume"
                      style={{ accentColor: palette.primary }}
                      className="w-22 h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[11px] text-zinc-300 font-bold ml-2 select-none w-7 text-right" aria-hidden="true">
                      {isMuted ? 0 : volume}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Meta Tags Row: Year, Runtime, Content Rating, TMDB Rating */}
            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300 pt-1 flex-wrap">
              {releaseDate && <span>{formatYear(releaseDate)}</span>}
              {runtime ? (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{formatRuntime(runtime)}</span>
                </>
              ) : null}
              {certification && (
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-[11px] font-bold text-zinc-200 border border-white/10">
                  <span className="sr-only">Rated </span>
                  {certification}
                </span>
              )}
              {details.vote_average > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" aria-hidden="true" />
                    <span>
                      <span className="sr-only">TMDB rating </span>
                      {Math.round(details.vote_average * 10) / 10}
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Director Byline */}
            {director && (
              <div className="text-xs text-zinc-400">
                <span>Director: </span>
                <span className="text-zinc-200 font-semibold">{director.name}</span>
              </div>
            )}

            {/* Synopsis with Read More Toggle */}
            {details.overview && (
              <div className="flex flex-col gap-1 pt-1">
                <p
                  className={cn(
                    'text-xs sm:text-sm text-zinc-300 leading-relaxed transition-all',
                    !isBioExpanded && 'line-clamp-3'
                  )}
                >
                  {details.overview}
                </p>
                {details.overview.length > 220 && (
                  <button
                    type="button"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    aria-expanded={isBioExpanded}
                    className="text-xs font-bold text-zinc-300 hover:text-white self-start transition-colors"
                  >
                    {isBioExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Cinema Stats Card (Translucent Minimal Glass with Hover Opacity) */}
          <div className="w-full lg:w-84 xl:w-96 rounded-2xl sm:rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 p-4 sm:p-6 flex flex-col gap-3 sm:gap-3.5 shadow-2xl">
            {runtime ? (
              <div className="flex items-center justify-between text-xs sm:text-sm pb-2.5 border-b border-white/[0.06]">
                <span className="text-zinc-400 font-medium">Runtime</span>
                <span className="text-zinc-100 font-semibold text-right">{formatEndTime(runtime)}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-xs sm:text-sm pb-2.5 border-b border-white/[0.06]">
              <span className="text-zinc-400 font-medium">Language</span>
              <span className="text-zinc-100 font-bold uppercase">{details.original_language || 'EN'}</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm pb-2.5 border-b border-white/[0.06]">
              <span className="text-zinc-400 font-medium">Release Date</span>
              <span className="text-zinc-100 font-semibold">{formatDateFull(releaseDate)}</span>
            </div>

            {type === 'movie' && (
              <>
                <div className="flex items-center justify-between text-xs sm:text-sm pb-2.5 border-b border-white/[0.06]">
                  <span className="text-zinc-400 font-medium">Budget</span>
                  <span className="text-zinc-100 font-semibold">{formatCurrency(budget)}</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm pb-2.5 border-b border-white/[0.06]">
                  <span className="text-zinc-400 font-medium">Revenue</span>
                  <span className="text-zinc-100 font-semibold">{formatCurrency(revenue)}</span>
                </div>
              </>
            )}

            {/* Watch progress stats */}
            {historyItem && (hasProgress || historyItem.finished) && (
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-red-950/30 border border-red-500/20 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Watch Status</span>
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-500" aria-hidden="true" />
                    {historyItem.finished ? 'Watched' : 'In progress'}
                  </span>
                </div>
                {hasProgress && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-medium">Left off</span>
                    <span className="text-zinc-200 font-bold">{historyItem.timestampFormatted}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Last Watched</span>
                  <span className="text-zinc-300 font-medium">
                    {formatRelativeTime(historyItem.lastWatchedAt)}
                  </span>
                </div>
              </div>
            )}

            {/* Production Studios */}
            {companies.length > 0 && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {companies.slice(0, 4).map((comp) => (
                  <span
                    key={comp.id}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-900/90 border border-white/10 text-zinc-300 font-medium"
                  >
                    {comp.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Main Body Content Sections (Widescreen Spacious Layout) */}
      <div className="max-w-[1750px] mx-auto w-full px-4 sm:px-10 lg:px-16 xl:px-20 py-10 sm:py-16 pb-36 sm:pb-24 flex flex-col gap-10 sm:gap-16 z-20">
        {/* Cast Showcase (Circular Avatars) */}
        {details.credits?.cast && <CastList cast={details.credits.cast} />}

        {/* TV Series Seasons & Episodes Navigator */}
        {type === 'tv' && seasons.length > 0 && (
          <section className="w-full flex flex-col gap-6" aria-labelledby="episodes-heading">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 id="episodes-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-6 h-6 text-red-500" aria-hidden="true" />
                  <span>Episodes & Seasons</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Select a season and episode to stream.
                </p>
              </div>

              {/* Season Select Dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedSeasonNum}
                  onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                  aria-label="Season"
                  className="appearance-none bg-zinc-900/90 border border-white/15 text-white text-xs sm:text-sm font-semibold rounded-xl px-4 py-2.5 pr-9 focus:border-red-500 cursor-pointer shadow-lg backdrop-blur-xl"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      Season {s.season_number} ({s.episode_count} Episodes)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {/* Episodes Grid */}
            {isSeasonLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5" role="status" aria-label="Loading episodes">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-black/30 border border-white/10 p-3 animate-pulse">
                    <div className="aspect-video rounded-xl bg-zinc-800/60 mb-3" />
                    <div className="h-4 w-2/3 rounded bg-zinc-800/60 mb-2" />
                    <div className="h-3 w-full rounded bg-zinc-800/40" />
                  </div>
                ))}
              </div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {seasonData.episodes.map((ep: TMDBEpisode) => {
                  const isLastWatched =
                    historyItem?.season === selectedSeasonNum && historyItem?.episode === ep.episode_number;
                  return (
                  <Link
                    key={ep.id}
                    href={`/watch/tv/${details.id}?season=${selectedSeasonNum}&episode=${ep.episode_number}`}
                    className={cn(
                      'group flex flex-col rounded-2xl overflow-hidden bg-black/35 hover:bg-black/55 backdrop-blur-md border transition-all duration-300 p-3 shadow-xl',
                      isLastWatched ? 'border-red-500/50' : 'border-white/10 hover:border-white/25'
                    )}
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 mb-3">
                      <Image
                        src={getImageUrl(ep.still_path || details.backdrop_path, 'w500')}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 350px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[11px] font-extrabold text-white">
                        {isLastWatched ? 'Last watched' : `EP ${ep.episode_number}`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-white transition-colors">
                        {ep.episode_number}. {ep.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ep.overview || 'No episode summary available.'}
                      </p>
                    </div>
                  </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 text-sm">
                No episode list found for this season.
              </div>
            )}
          </section>
        )}

        {/* 4. "Trailers & Clips" Multi-Video Gallery with Fallback */}
        <section className="w-full flex flex-col gap-5" aria-labelledby="videos-heading">
          <div className="flex items-center justify-between">
            <h2 id="videos-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight">Trailers & Clips</h2>
            {allVideos.length > 0 && (
              <span className="text-xs sm:text-sm text-zinc-400 font-semibold">{allVideos.length} videos</span>
            )}
          </div>

          {allVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {allVideos.slice(0, 10).map((vid) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => setSelectedModalVideo(vid)}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all duration-300 text-left p-3 shadow-xl"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-2.5">
                    <Image
                      src={`https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 350px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-bold text-white uppercase">
                      {vid.type}
                    </div>
                  </div>

                  <span className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
                    {vid.name}
                  </span>
                  <span className="text-xs text-zinc-400 mt-0.5 font-medium">{vid.type}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
              {/* Fallback Movie Poster Card */}
              <div className="relative w-36 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex-shrink-0 bg-zinc-950">
                <Image
                  src={getPosterUrl(details.poster_path || details.backdrop_path, 'w500')}
                  alt={`${title} poster`}
                  fill
                  sizes="(max-width: 640px) 150px, 180px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col gap-2 text-center md:text-left max-w-xl">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
                  <Film className="w-4 h-4" aria-hidden="true" />
                  <span>No trailer available</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-white">{title}</p>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  TMDB doesn&apos;t list any trailers or clips for this title yet.
                </p>
                <div className="pt-2">
                  <Link
                    href={resumeHref}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" aria-hidden="true" />
                    <span>Start watching</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 5. "You Might Also Like" Recommendation Carousel (Aligned with Trailers & Clips) */}
        {recommendations.length > 0 && (
          <div className="pt-2">
            <MediaCarousel
              title="You Might Also Like"
              icon={Sparkles}
              items={recommendations}
              fullWidth={true}
            />
          </div>
        )}
      </div>

      {/* Video Popup Modal */}
      {selectedModalVideo && (
        <Modal
          isOpen={Boolean(selectedModalVideo)}
          onClose={() => setSelectedModalVideo(null)}
          title={selectedModalVideo.name}
        >
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${selectedModalVideo.key}?autoplay=1&rel=0`}
              title={selectedModalVideo.name}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
