'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  RefreshCw,
  Maximize,
  Minimize,
  Layers,
  Sparkles,
  ChevronDown,
  Play,
  X,
} from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getTVSeason,
  getImageUrl,
  getBackdropUrl,
} from '@/lib/tmdb';
import { TMDBMovieDetails, TMDBTVDetails, TMDBSeason, TMDBEpisode, MediaType } from '@/types/tmdb';
import { getVideasyPlayerUrl } from '@/lib/videasy';
import { extractPaletteFromImage, getPaletteForGenre, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { useUserStore } from '@/lib/store';
import { formatSeconds, cn } from '@/lib/utils';

function rgbStringToHex(rgbStr: string): string {
  const match = rgbStr.match(/\d+/g);
  if (!match || match.length < 3) return 'e50914';
  const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
  return `${r}${g}${b}`;
}

function WatchContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const type = ((routeParams?.type as string) || 'movie') as MediaType;
  const id = (routeParams?.id as string) || '';

  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  const season = seasonParam ? parseInt(seasonParam, 10) : 1;
  const episode = episodeParam ? parseInt(episodeParam, 10) : 1;

  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(season);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { saveProgress } = useUserStore();

  // Load Media Details & Extract Palette
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      try {
        if (type === 'movie') {
          const res = await getMovieDetails(id);
          setDetails(res);
          const genreId = res.genres?.[0]?.id;
          if (genreId) setPalette(getPaletteForGenre(genreId));
          if (res.backdrop_path || res.poster_path) {
            const sampleUrl = getBackdropUrl(res.backdrop_path || res.poster_path, 'w780');
            extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
          }
          saveProgress({
            id: res.id,
            type: 'movie',
            title: res.title || 'Untitled Movie',
            poster_path: res.poster_path,
            backdrop_path: res.backdrop_path,
            vote_average: res.vote_average,
            release_date: res.release_date,
          });
        } else {
          const res = await getTVDetails(id);
          setDetails(res);
          setSelectedSeasonNum(season);
          const genreId = res.genres?.[0]?.id;
          if (genreId) setPalette(getPaletteForGenre(genreId));
          if (res.backdrop_path || res.poster_path) {
            const sampleUrl = getBackdropUrl(res.backdrop_path || res.poster_path, 'w780');
            extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
          }
          saveProgress({
            id: res.id,
            type: 'tv',
            title: res.name || 'Untitled TV Series',
            poster_path: res.poster_path,
            backdrop_path: res.backdrop_path,
            vote_average: res.vote_average,
            release_date: res.first_air_date,
            season,
            episode,
          });
        }
      } catch (err) {
        console.error('Failed to load media for stream:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [type, id, season, episode, saveProgress]);

  // Load Season Data for TV episode switcher
  useEffect(() => {
    if (type !== 'tv' || !id) return;

    async function loadSeason() {
      setIsSeasonLoading(true);
      try {
        const res = await getTVSeason(id, selectedSeasonNum);
        setSeasonData(res);
      } catch (err) {
        console.error('Failed to load season episodes:', err);
      } finally {
        setIsSeasonLoading(false);
      }
    }

    loadSeason();
  }, [type, id, selectedSeasonNum]);

  // Auto-hide controls on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isEpisodeDrawerOpen) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Fullscreen Request Handler
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  }, []);

  // Listen for keyboard shortcuts and player postMessage events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isEpisodeDrawerOpen) {
        setIsEpisodeDrawerOpen(false);
      }
    };

    // Listen for player postMessage events (e.g. timeupdate, progress)
    const handleMessage = (e: MessageEvent) => {
      try {
        let payload = e.data;
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }
        if (!payload) return;

        const currentTime = payload.currentTime || payload.data?.currentTime || payload.time || payload.data?.time;
        const duration = payload.duration || payload.data?.duration;

        if (typeof currentTime === 'number' && currentTime > 0) {
          const progressPercent = duration && duration > 0 ? Math.round((currentTime / duration) * 100) : undefined;
          const formatted = formatSeconds(currentTime);

          if (details) {
            saveProgress({
              id: details.id,
              type,
              title: (details as any).title || (details as any).name || 'Untitled',
              poster_path: details.poster_path,
              backdrop_path: details.backdrop_path,
              vote_average: details.vote_average,
              release_date: (details as any).release_date || (details as any).first_air_date,
              season: type === 'tv' ? season : undefined,
              episode: type === 'tv' ? episode : undefined,
              progressSeconds: Math.floor(currentTime),
              durationSeconds: duration ? Math.floor(duration) : undefined,
              progressPercent,
              timestampFormatted: formatted,
            });
          }
        }
      } catch {
        // Non-JSON or unrelated postMessage
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [toggleFullscreen, isEpisodeDrawerOpen, details, type, season, episode, saveProgress]);

  const playerUrl = getVideasyPlayerUrl(type, id, season, episode, {
    color: rgbStringToHex(palette.primary),
    autoplay: true,
    nextEpisode: true,
    episodeList: true,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black z-50 flex flex-col items-center justify-center text-center px-4 select-none">
        <div className="relative mb-4">
          <div
            className="w-16 h-16 rounded-full border-4 border-white/10 animate-spin"
            style={{ borderTopColor: palette.primary }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-pulse" style={{ color: palette.primary }} />
          </div>
        </div>
        <p className="text-lg font-black text-white tracking-tight">Starting Cinema Stream...</p>
        <p className="text-xs text-zinc-500 mt-1">Connecting to Videasy cluster</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black z-50 flex flex-col items-center justify-center text-center px-4 select-none">
        <h2 className="text-2xl font-bold text-white mb-2">Stream Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Could not find stream metadata for this title.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-all hover:scale-105"
          style={{ backgroundColor: palette.primary, boxShadow: `0 4px 18px ${palette.primaryGlow}` }}
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const title = details.title || details.name || 'Untitled';
  const tvDetails = details as TMDBTVDetails;
  const seasons = tvDetails.seasons?.filter((s) => s.season_number > 0) || [];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 w-screen h-screen bg-black z-50 overflow-hidden flex flex-col items-center justify-center select-none"
    >
      {/* 1. Fullscreen Videasy Player Iframe */}
      <iframe
        key={playerUrl}
        src={playerUrl}
        title={`Cinema player - ${title}`}
        onLoad={() => setIsPlayerLoading(false)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *; display-capture"
        allowFullScreen={true}
        className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
      />

      {/* Loading Overlay */}
      {isPlayerLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md gap-4 pointer-events-none">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full border-4 border-white/10 animate-spin"
              style={{ borderTopColor: palette.primary }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" style={{ color: palette.primary }} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-white tracking-wide">Buffering Cinema Stream</p>
            <p className="text-xs text-zinc-400">
              {title} • {type === 'tv' ? `Season ${season}, Episode ${episode}` : 'Full Movie'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Floating Top Header Cinema Controls Overlay */}
      <div
        className={cn(
          'absolute top-0 inset-x-0 z-30 p-4 sm:p-6 flex items-center justify-between gap-4 pointer-events-none transition-opacity duration-300 bg-gradient-to-b from-black/80 via-black/40 to-transparent',
          showControls || isEpisodeDrawerOpen ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Top Left: Back Button & Title Badge */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            href={`/details/${type}/${id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 hover:bg-black/80 text-zinc-200 hover:text-white backdrop-blur-xl border border-white/15 text-xs font-bold shadow-2xl transition-all hover:scale-105 cursor-pointer"
            style={{ borderColor: palette.primaryGlow }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" style={{ color: palette.primary }} />
            <span className="hidden sm:inline">Details</span>
          </Link>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-xl">
            <span className="text-xs sm:text-sm font-black text-white line-clamp-1 max-w-[200px] sm:max-w-[400px]">
              {title}
            </span>
            {type === 'tv' && (
              <span
                className="px-2 py-0.5 rounded-md text-white text-[10px] font-extrabold uppercase"
                style={{ backgroundColor: palette.primary, boxShadow: `0 2px 10px ${palette.primaryGlow}` }}
              >
                S{season} E{episode}
              </span>
            )}
          </div>
        </div>

        {/* Top Right: TV Episodes Selector (if TV Show) */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {type === 'tv' && seasons.length > 0 && (
            <button
              onClick={() => setIsEpisodeDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xl border border-white/15 text-xs font-bold shadow-2xl transition-all hover:scale-105 cursor-pointer"
              style={{ borderColor: palette.primaryGlow }}
            >
              <Layers className="w-4 h-4" style={{ color: palette.primary }} />
              <span>Episodes</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TV Episode Selector Drawer / Overlay Modal */}
      {isEpisodeDrawerOpen && type === 'tv' && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col justify-end sm:justify-center items-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[85vh] bg-zinc-900/95 border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: palette.primaryGlow,
                    borderColor: palette.primary,
                    color: palette.primary,
                  }}
                >
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Select Episode</h3>
                  <p className="text-xs text-zinc-400">{title}</p>
                </div>
              </div>

              {/* Season Selector & Close */}
              <div className="flex items-center gap-3">
                <div className="relative inline-block">
                  <select
                    value={selectedSeasonNum}
                    onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                    className="appearance-none bg-zinc-800 border border-white/15 text-white text-xs font-semibold rounded-xl px-4 py-2 pr-8 focus:outline-none cursor-pointer"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number} ({s.episode_count} Ep)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                </div>

                <button
                  onClick={() => setIsEpisodeDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Episodes List / Grid */}
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {isSeasonLoading ? (
                <div className="py-16 text-center text-zinc-400 text-sm">
                  Loading Season {selectedSeasonNum} episodes...
                </div>
              ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {seasonData.episodes.map((ep: TMDBEpisode) => {
                    const isCurrent = season === selectedSeasonNum && episode === ep.episode_number;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => {
                          setIsEpisodeDrawerOpen(false);
                          setIsPlayerLoading(true);
                          router.push(`/watch/tv/${id}?season=${selectedSeasonNum}&episode=${ep.episode_number}`);
                        }}
                        className={cn(
                          'group flex gap-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer',
                          !isCurrent && 'bg-zinc-800/40 hover:bg-zinc-800/90 border-white/5 hover:border-white/20'
                        )}
                        style={
                          isCurrent
                            ? {
                                borderColor: palette.primary,
                                backgroundColor: palette.primaryGlow,
                                boxShadow: `0 4px 18px ${palette.primaryGlow}`,
                              }
                            : undefined
                        }
                      >
                        <div className="relative aspect-video w-24 rounded-xl overflow-hidden bg-black shrink-0">
                          <Image
                            src={getImageUrl(ep.still_path || details.backdrop_path, 'w500')}
                            alt={ep.name}
                            fill
                            sizes="120px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-black text-white">
                            EP {ep.episode_number}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-0.5 overflow-hidden">
                          <span
                            className="font-bold text-xs line-clamp-1 transition-colors"
                            style={isCurrent ? { color: '#ffffff', fontWeight: 800 } : undefined}
                          >
                            {ep.episode_number}. {ep.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {ep.overview || 'No episode description.'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No episodes found for this season.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 w-screen h-screen bg-black z-50 flex items-center justify-center text-zinc-400 text-sm">
          Loading Cinema Stream...
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
