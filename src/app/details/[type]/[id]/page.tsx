'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
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
  Plus,
  Check,
  Film,
  Tv,
  Youtube,
  Layers,
  Sparkles,
  ChevronDown,
  Building2,
  RotateCcw,
} from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getTVSeason,
  getBackdropUrl,
  getPosterUrl,
  getImageUrl,
  getLogoUrl,
  normalizeMediaItem,
} from '@/lib/tmdb';
import {
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBSeason,
  TMDBEpisode,
  TMDBVideo,
  MediaType,
} from '@/types/tmdb';
import { formatRuntime, formatYear, formatEndTime, formatCurrency, formatDateFull, formatSeconds, formatRelativeTime, cn } from '@/lib/utils';
import { extractPaletteFromImage, getPaletteForGenre, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { CastList } from '@/components/media/CastList';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { useUserStore } from '@/lib/store';

export default function MediaDetailsPage() {
  const routeParams = useParams();
  const type = ((routeParams?.type as string) || 'movie') as MediaType;
  const id = (routeParams?.id as string) || '';

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { history, hasHydrated } = useUserStore();
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
  const [isLoading, setIsLoading] = useState(true);

  // Seamless unmute without reloading or restarting YouTube trailer
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

  // Live volume slider control
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

  // Load Main Media Details
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      try {
        if (type === 'movie') {
          const res = await getMovieDetails(id);
          setDetails(res);
          const genreId = res.genres?.[0]?.id;
          if (res.backdrop_path || res.poster_path) {
            const sampleUrl = getBackdropUrl(res.backdrop_path || res.poster_path, 'w780');
            extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
          } else if (genreId) {
            setPalette(getPaletteForGenre(genreId));
          }
        } else {
          const res = await getTVDetails(id);
          setDetails(res);
          const genreId = res.genres?.[0]?.id;
          if (res.backdrop_path || res.poster_path) {
            const sampleUrl = getBackdropUrl(res.backdrop_path || res.poster_path, 'w780');
            extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
          } else if (genreId) {
            setPalette(getPaletteForGenre(genreId));
          }
          const firstSeason = res.seasons?.find((s) => s.season_number > 0) || res.seasons?.[0];
          if (firstSeason) {
            setSelectedSeasonNum(firstSeason.season_number);
          }
        }
      } catch (err) {
        console.error('Failed to load media details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [type, id]);

  // Load Season Episodes when selectedSeasonNum changes (for TV)
  useEffect(() => {
    if (type !== 'tv' || !id) return;

    async function loadSeasonEpisodes() {
      setIsSeasonLoading(true);
      try {
        const season = await getTVSeason(id, selectedSeasonNum);
        setSeasonData(season);
      } catch (err) {
        console.error('Failed to load season:', err);
      } finally {
        setIsSeasonLoading(false);
      }
    }

    loadSeasonEpisodes();
  }, [type, id, selectedSeasonNum]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 max-w-7xl mx-auto px-4">
        <SkeletonBanner />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Title Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          The movie or TV series you requested could not be retrieved from TMDB.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const title = details.title || details.name || details.original_title || 'Untitled';
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

  const recommendations = [
    ...(details.recommendations?.results || []),
    ...(details.similar?.results || []),
  ]
    .slice(0, 12)
    .map((item) => normalizeMediaItem(item, type));

  const historyItem = hasHydrated
    ? history.find((h) => h.id === details.id && h.type === type)
    : undefined;

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
      {/* 1. Dynamic Multi-Color Ambient Lighting Canvas (Covers entire screen from Hero through Footer seamlessly) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dynamic High-Diffusion Multi-Color Backdrop Image */}
        {details.backdrop_path && (
          <div className="absolute -inset-[15%] pointer-events-none overflow-hidden">
            <Image
              src={getBackdropUrl(details.backdrop_path, 'w1280')}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover scale-125 filter blur-[80px] saturate-[260%] brightness-75 opacity-70 transition-all duration-1000"
            />
          </div>
        )}

        {/* Spot 1: Vibrant Primary Color Bloom (Top Left - Behind Title) */}
        <div
          className="absolute -top-[10%] -left-[15%] w-[85vw] h-[900px] rounded-full filter blur-[100px] opacity-80 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.primaryGlow }}
        />

        {/* Spot 2: Vibrant Secondary Color Bloom (Top Right - Behind Hero Stats) */}
        <div
          className="absolute top-[5%] -right-[15%] w-[85vw] h-[900px] rounded-full filter blur-[110px] opacity-75 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.secondaryGlow }}
        />

        {/* Spot 3: Chromatic Tertiary Color Bloom (Mid Body - Behind Cast & Episodes) */}
        <div
          className="absolute top-[35%] -left-[20%] w-[90vw] h-[950px] rounded-full filter blur-[120px] opacity-75 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.tertiaryGlow }}
        />

        {/* Spot 4: Atmospheric Quaternary Color Bloom (Lower Body & Footer) */}
        <div
          className="absolute top-[60%] -right-[20%] w-[95vw] h-[1000px] rounded-full filter blur-[120px] opacity-70 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.quaternaryGlow }}
        />

        {/* Multi-Point Chromatic Radial Mesh Lighting */}
        <div
          className="absolute inset-0 opacity-60 transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse 90% 70% at 15% 20%, ${palette.primaryGlow}, transparent 60%), radial-gradient(ellipse 90% 70% at 85% 30%, ${palette.secondaryGlow}, transparent 60%), radial-gradient(ellipse 90% 70% at 20% 65%, ${palette.tertiaryGlow}, transparent 60%), radial-gradient(ellipse 100% 70% at 80% 85%, ${palette.quaternaryGlow}, transparent 60%)`,
          }}
        />

        {/* Unified luxury dark base overlay */}
        <div className="absolute inset-0 bg-[#07090e]/40" />
      </div>

      {/* 2. Expansive Hero Section with Smooth Linear Video Dissolve */}
      <div className="relative w-full min-h-[740px] sm:min-h-[840px] lg:min-h-[940px] xl:min-h-[980px] overflow-hidden flex flex-col justify-end z-10">
        {/* Ambient Video Ambilight Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[70vh] rounded-full filter blur-[100px] opacity-60 pointer-events-none -z-0 transition-all duration-1000"
          style={{ backgroundColor: palette.primaryGlow }}
        />

        {/* Background Video Trailer Layer or Fallback Backdrop with Smooth Linear Fade (No Curved Elliptical Arcs) */}
        {mainTrailer ? (
          <div
            className={cn(
              "absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none -z-0 transition-opacity duration-1000",
              isTrailerLoaded ? "opacity-75 md:opacity-85" : "opacity-0"
            )}
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
            }}
          >
            <iframe
              ref={iframeRef}
              key={`bg-trailer-${mainTrailer.key}`}
              src={`https://www.youtube-nocookie.com/embed/${mainTrailer.key}?autoplay=1&mute=1&loop=1&playlist=${mainTrailer.key}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&disablekb=1&fs=0`}
              title="Ambient trailer background"
              onLoad={() => {
                setTimeout(() => setIsTrailerLoaded(true), 600);
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380vw] h-[215vw] sm:w-[220vw] sm:h-[125vw] md:w-[150vw] md:h-[150vh] max-w-none max-h-none object-cover filter brightness-100 contrast-[1.02] border-0 outline-none pointer-events-none"
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none -z-0"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 90%)',
            }}
          >
            <Image
              src={getBackdropUrl(details.backdrop_path || details.poster_path, 'original')}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top filter brightness-85"
            />
          </div>
        )}

        {/* Soft top gradient only for navbar separation */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent pointer-events-none z-10" />

        {/* Hero Content Overlay (Left Info + Right Stats) */}
        <div className="relative max-w-[1750px] mx-auto w-full px-4 sm:px-10 lg:px-16 xl:px-20 pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 z-20 flex flex-col lg:flex-row items-end justify-between gap-8 lg:gap-12">
          {/* Left Column: Title, Genres, Actions, Synopsis */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-5 max-w-4xl w-full">
            {/* Title: Official TMDB Graphic Logo with Text Fallback */}
            {(() => {
              const logo =
                details.images?.logos?.find((l) => l.iso_639_1 === 'en' && l.file_path?.endsWith('.png')) ||
                details.images?.logos?.find((l) => l.iso_639_1 === 'en') ||
                details.images?.logos?.find((l) => l.file_path?.endsWith('.png')) ||
                details.images?.logos?.[0];

              if (logo?.file_path) {
                return (
                  <div className="relative w-full max-w-[280px] sm:max-w-[460px] md:max-w-[640px] lg:max-w-[780px] h-20 sm:h-32 md:h-44 lg:h-56 my-1 sm:my-2">
                    <Image
                      src={getLogoUrl(logo.file_path, 'w500')}
                      alt={title}
                      fill
                      priority
                      className="object-contain object-left filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]"
                    />
                  </div>
                );
              }

              return (
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight">
                  {title}
                </h1>
              );
            })()}

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

            {/* Watch History Timestamp Banner (if item has been watched) */}
            {historyItem && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 border border-red-500/30 backdrop-blur-md w-fit text-xs text-zinc-300 animate-fade-in shadow-lg">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <span className="font-semibold text-white">In Your History:</span>
                {historyItem.type === 'tv' && historyItem.season && historyItem.episode ? (
                  <span className="text-red-400 font-bold">
                    Season {historyItem.season}, Episode {historyItem.episode}
                  </span>
                ) : null}
                {historyItem.timestampFormatted ? (
                  <span className="text-zinc-300">
                    Left off at <strong className="text-red-400">{historyItem.timestampFormatted}</strong>
                  </span>
                ) : historyItem.progressSeconds ? (
                  <span className="text-zinc-300">
                    Left off at <strong className="text-red-400">{formatSeconds(historyItem.progressSeconds)}</strong>
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    Watched {formatRelativeTime(historyItem.lastWatchedAt)}
                  </span>
                )}
                {historyItem.progressPercent ? (
                  <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 text-[10px] font-extrabold border border-red-500/30">
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
                <Play className="w-4 h-4 fill-black" />
                <span>{historyItem ? 'Resume Playback' : 'Play'}</span>
              </Link>

              {/* Secondary 'Start from Beginning' Button if in history */}
              {historyItem && (
                <Link
                  href={playStartHref}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-white/10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>From Start</span>
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
              {mainTrailer && (
                <div
                  className="group/vol relative flex items-center h-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xl border border-white/15 px-3.5 transition-all duration-300 shadow-xl"
                  style={{ borderColor: isVolumeOpen ? palette.primaryGlow : undefined }}
                  onMouseEnter={() => setIsVolumeOpen(true)}
                  onMouseLeave={() => setIsVolumeOpen(false)}
                >
                  <button
                    onClick={() => {
                      toggleMute();
                      setIsVolumeOpen(true);
                    }}
                    title={isMuted ? 'Unmute Trailer Audio' : 'Mute Trailer Audio'}
                    className="flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-zinc-400" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-4 h-4 animate-pulse" style={{ color: palette.primary }} />
                    ) : (
                      <Volume2 className="w-4 h-4 animate-pulse" style={{ color: palette.primary }} />
                    )}
                  </button>

                  {/* Play / Pause Trailer Button on Hover */}
                  {isVolumeOpen && (
                    <button
                      onClick={() => {
                        if (iframeRef.current?.contentWindow) {
                          iframeRef.current.contentWindow.postMessage(
                            JSON.stringify({
                              event: 'command',
                              func: isTrailerLoaded ? 'pauseVideo' : 'playVideo',
                              args: [],
                            }),
                            '*'
                          );
                        }
                      }}
                      title="Pause / Play Trailer"
                      className="ml-2 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}

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
                      style={{ accentColor: palette.primary }}
                      className="w-22 h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-300 font-bold ml-2 select-none w-6 text-right">
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
              <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-[11px] font-bold text-zinc-200 border border-white/10">
                {type === 'movie' ? 'PG-13' : 'TV-MA'}
              </span>
              {details.vote_average > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{Math.round(details.vote_average * 10) / 10}</span>
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
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-xs font-bold text-zinc-400 hover:text-white self-start transition-colors cursor-pointer"
                  >
                    {isBioExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Cinema Stats Card (Translucent Minimal Glass with Hover Opacity) */}
          <div className="w-full lg:w-84 xl:w-96 rounded-2xl sm:rounded-3xl bg-black/25 hover:bg-black/40 backdrop-blur-md border border-white/10 p-4 sm:p-6 flex flex-col gap-3 sm:gap-3.5 shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100">
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

            {/* Watch History Stats (if in history) */}
            {historyItem && (
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-red-950/30 border border-red-500/20 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Watch Status</span>
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-500" />
                    In Progress
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Left Off</span>
                  <span className="text-zinc-200 font-bold">
                    {historyItem.timestampFormatted || (historyItem.progressSeconds ? formatSeconds(historyItem.progressSeconds) : 'Saved')}
                  </span>
                </div>
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
      </div>

      {/* 3. Main Body Content Sections (Widescreen Spacious Layout) */}
      <div className="max-w-[1750px] mx-auto w-full px-4 sm:px-10 lg:px-16 xl:px-20 py-10 sm:py-16 pb-36 sm:pb-24 flex flex-col gap-10 sm:gap-16 z-20">
        {/* Cast Showcase (Circular Avatars) */}
        {details.credits?.cast && <CastList cast={details.credits.cast} />}

        {/* TV Series Seasons & Episodes Navigator */}
        {type === 'tv' && seasons.length > 0 && (
          <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-6 h-6 text-red-500" />
                  <span>Episodes & Seasons</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Select a season and episode to stream.
                </p>
              </div>

              {/* Season Select Dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedSeasonNum}
                  onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                  className="appearance-none bg-zinc-900/90 border border-white/15 text-white text-xs sm:text-sm font-semibold rounded-xl px-4 py-2.5 pr-9 focus:outline-none focus:border-red-500 cursor-pointer shadow-lg backdrop-blur-xl"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      Season {s.season_number} ({s.episode_count} Episodes)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Episodes Grid */}
            {isSeasonLoading ? (
              <div className="py-12 text-center text-zinc-400 text-sm">
                Loading season {selectedSeasonNum} episodes...
              </div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {seasonData.episodes.map((ep: TMDBEpisode) => (
                  <Link
                    key={ep.id}
                    href={`/watch/tv/${details.id}?season=${selectedSeasonNum}&episode=${ep.episode_number}`}
                    className="group flex flex-col rounded-2xl overflow-hidden bg-black/20 hover:bg-black/45 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all duration-300 p-3 shadow-xl opacity-80 hover:opacity-100"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 mb-3">
                      <Image
                        src={getImageUrl(ep.still_path || details.backdrop_path, 'w500')}
                        alt={ep.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 350px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-extrabold text-white">
                        EP {ep.episode_number}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-white transition-colors">
                        {ep.episode_number}. {ep.name}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ep.overview || 'No episode summary available.'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No episode list found for this season.
              </div>
            )}
          </div>
        )}

        {/* 4. "Trailers & Clips" Multi-Video Gallery with Fallback */}
        <div className="w-full flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Trailers & Clips</h3>
            <span className="text-xs sm:text-sm text-zinc-400 font-semibold">
              {allVideos.length > 0 ? `${allVideos.length} Videos Available` : 'HD Stream Ready'}
            </span>
          </div>

          {allVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {allVideos.slice(0, 10).map((vid) => (
                <button
                  key={vid.id}
                  onClick={() => setSelectedModalVideo(vid)}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-black/20 hover:bg-black/45 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all duration-300 text-left cursor-pointer p-3 shadow-xl opacity-80 hover:opacity-100"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-2.5">
                    <Image
                      src={`https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`}
                      alt={vid.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 350px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white uppercase">
                      {vid.type}
                    </div>
                  </div>

                  <span className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
                    {vid.name}
                  </span>
                  <span className="text-xs text-zinc-500 mt-0.5 font-medium">{vid.type}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full rounded-3xl bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4 shadow-xl opacity-80 hover:opacity-100 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-400">
                <Film className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h4 className="text-base sm:text-lg font-bold text-white">No official video clips available</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Studio trailers for this title are currently unavailable on TMDB. You can start streaming the full movie or series directly in HD above.
                </p>
              </div>
              <Link
                href={resumeHref}
                className="mt-1 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-xl transition-all hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Start Watching Now</span>
              </Link>
            </div>
          )}
        </div>

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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
