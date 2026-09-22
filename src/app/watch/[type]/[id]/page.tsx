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
  Play,
  X,
  Activity,
  Zap,
  Check,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getTVSeason,
  getImageUrl,
  getBackdropUrl,
} from '@/lib/tmdb';
import { TMDBMovieDetails, TMDBTVDetails, TMDBSeason, TMDBEpisode, MediaType } from '@/types/tmdb';
import { STREAMING_SERVERS, getPlayerUrlForServer, StreamingSource } from '@/lib/playerSources';
import { extractPaletteFromImage, getPaletteForGenre, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { useUserStore } from '@/lib/store';
import { formatSeconds, cn } from '@/lib/utils';

function WatchContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const type = ((routeParams?.type as string) || 'movie') as MediaType | 'anime';
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
  const [reloadKey, setReloadKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { preferredServerId, setPreferredServerId, saveProgress, adShieldEnabled, setAdShieldEnabled } = useUserStore();

  const [activeServer, setActiveServer] = useState<'111movies' | 'filmu'>(
    preferredServerId === 'filmu' ? 'filmu' : '111movies'
  );
  const [serverLatencies, setServerLatencies] = useState<{ '111movies'?: number; filmu?: number }>({});
  const [hasProbed, setHasProbed] = useState(false);

  // 1. Run Pre-Flight Speed Probe between 111movies and Filmu on mount
  useEffect(() => {
    if (!id || hasProbed) return;

    let isMounted = true;
    const probeServer = async (server: StreamingSource): Promise<{ id: '111movies' | 'filmu'; latency: number; ok: boolean }> => {
      const t0 = performance.now();
      const testUrl = server.id === 'filmu'
        ? `https://embed.filmu.in/movie/${id}`
        : `https://111movies.com/movie/${id}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        await fetch(testUrl, {
          mode: 'no-cors',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - t0);
        return { id: server.id, latency, ok: true };
      } catch {
        return { id: server.id, latency: 9999, ok: false };
      }
    };

    Promise.all([
      probeServer(STREAMING_SERVERS[0]), // 111movies
      probeServer(STREAMING_SERVERS[1]), // filmu
    ]).then(([res111, resFilmu]) => {
      if (!isMounted) return;
      setHasProbed(true);
      setServerLatencies({
        '111movies': res111.ok ? res111.latency : undefined,
        filmu: resFilmu.ok ? resFilmu.latency : undefined,
      });

      // If user hasn't explicitly set a preference, pick the faster responding server
      if (resFilmu.ok && resFilmu.latency < res111.latency) {
        setActiveServer('filmu');
        setPreferredServerId('filmu');
      } else if (res111.ok) {
        setActiveServer('111movies');
        setPreferredServerId('111movies');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id, hasProbed, setPreferredServerId]);

  // 2. Load Media Details & Extract Palette
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
            progressSeconds: 0,
            timestampFormatted: '0:00',
          });
        } else {
          const res = await getTVDetails(id);
          setDetails(res);
          const genreId = res.genres?.[0]?.id;
          if (genreId) setPalette(getPaletteForGenre(genreId));
          if (res.backdrop_path || res.poster_path) {
            const sampleUrl = getBackdropUrl(res.backdrop_path || res.poster_path, 'w780');
            extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
          }
          saveProgress({
            id: res.id,
            type: 'tv',
            title: res.name || 'Untitled Series',
            poster_path: res.poster_path,
            backdrop_path: res.backdrop_path,
            vote_average: res.vote_average,
            release_date: res.first_air_date,
            season,
            episode,
            progressSeconds: 0,
            timestampFormatted: '0:00',
          });
        }
      } catch (err) {
        console.error('Failed to load media details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [type, id, season, episode, saveProgress]);

  // 3. Load Season Data for TV episode switcher
  useEffect(() => {
    if (type === 'movie' || !id) return;

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

  // Listen for keyboard shortcuts
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

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [toggleFullscreen, isEpisodeDrawerOpen]);

  const playerUrl = getPlayerUrlForServer(
    activeServer,
    type === 'anime' ? 'anime' : type,
    id,
    season,
    episode
  );

  const handleServerChange = (serverId: '111movies' | 'filmu') => {
    setActiveServer(serverId);
    setPreferredServerId(serverId);
    setIsPlayerLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleToggleOtherServer = () => {
    const nextServer = activeServer === '111movies' ? 'filmu' : '111movies';
    handleServerChange(nextServer);
  };

  const currentServer = STREAMING_SERVERS.find((s) => s.id === activeServer) || STREAMING_SERVERS[0];

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0f1014] z-50 flex flex-col items-center justify-center text-center px-4 select-none">
        <div className="relative mb-4">
          <div
            className="w-14 h-14 rounded-full border-4 border-white/10 animate-spin"
            style={{ borderTopColor: '#e50914' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-semibold text-white tracking-wide">Benchmarking Player Servers...</p>
        <p className="text-xs text-zinc-500 mt-1">Testing 111movies and Filmu</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0f1014] z-50 flex flex-col items-center justify-center text-center px-4 select-none">
        <h2 className="text-2xl font-bold text-white mb-2">Stream Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Could not find stream metadata for this title.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all hover:scale-105"
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
      className="fixed inset-0 w-screen h-screen bg-[#0f1014] z-50 overflow-hidden flex flex-col items-center justify-center select-none"
    >
      {/* 1. Fullscreen Player Iframe (Protected by Ad-Shield HTML5 Sandbox) */}
      <iframe
        key={`${playerUrl}-${reloadKey}-${adShieldEnabled ? 'shield-on' : 'shield-off'}`}
        src={playerUrl}
        title={`Cinema player - ${title}`}
        onLoad={() => setIsPlayerLoading(false)}
        sandbox={
          adShieldEnabled
            ? 'allow-scripts allow-same-origin allow-forms allow-presentation'
            : 'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox'
        }
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *; display-capture"
        allowFullScreen={true}
        className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
      />

      {/* Loading & Buffering Overlay */}
      {isPlayerLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0f1014]/90 backdrop-blur-md gap-4 pointer-events-none">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full border-4 border-white/10 animate-spin"
              style={{ borderTopColor: '#e50914' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <p className="text-sm font-bold text-white tracking-wide">Connecting to {currentServer.name}</p>
            <p className="text-xs text-zinc-400">
              {title} {type === 'tv' ? `(Season ${season}, Episode ${episode})` : ''}
            </p>
          </div>

          {/* Quick Fallback Switcher */}
          <div className="flex items-center gap-2 pt-2 pointer-events-auto">
            <button
              onClick={handleToggleOtherServer}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch to {activeServer === '111movies' ? 'Filmu' : '111movies'}</span>
            </button>
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
            href={`/details/${type === 'anime' ? 'tv' : type}/${id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-zinc-200 hover:text-white backdrop-blur-xl border border-white/10 text-xs font-semibold shadow-2xl transition-all hover:scale-105 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">Details</span>
          </Link>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-xl">
            <span className="text-xs sm:text-sm font-semibold text-white line-clamp-1 max-w-[180px] sm:max-w-[320px]">
              {title}
            </span>
            {type !== 'movie' && (
              <span className="px-2 py-0.5 rounded text-white text-[10px] font-bold bg-red-600 tracking-wider">
                S{season} E{episode}
              </span>
            )}
          </div>
        </div>

        {/* Top Right: Dual Player Toggle & TV Episodes Selector */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Dual Server Switcher Pill */}
          <div className="flex items-center p-1 rounded-full bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl">
            <button
              onClick={() => handleServerChange('111movies')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                activeServer === '111movies'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
              title="Switch to 111movies (Clean HD)"
            >
              <Activity className="w-3 h-3" />
              <span>111movies</span>
              {serverLatencies['111movies'] && (
                <span className="text-[10px] opacity-75">{serverLatencies['111movies']}ms</span>
              )}
            </button>

            <button
              onClick={() => handleServerChange('filmu')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                activeServer === 'filmu'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
              title="Switch to Filmu (Ultra-Fast / Anime)"
            >
              <Zap className="w-3 h-3" />
              <span>Filmu</span>
              {serverLatencies['filmu'] && (
                <span className="text-[10px] opacity-75">{serverLatencies['filmu']}ms</span>
              )}
            </button>
          </div>

          {/* Ad Shield Toggle Pill */}
          <button
            onClick={() => setAdShieldEnabled(!adShieldEnabled)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95',
              adShieldEnabled
                ? 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border-amber-500/30'
            )}
            title={
              adShieldEnabled
                ? 'Ad Shield: Active (Popups and redirects blocked). Click to relax if playback fails.'
                : 'Ad Shield: Relaxed (Popups allowed). Click to block ads.'
            }
          >
            {adShieldEnabled ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">{adShieldEnabled ? 'Shield On' : 'Shield Off'}</span>
          </button>

          {type !== 'movie' && seasons.length > 0 && (
            <button
              onClick={() => setIsEpisodeDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xl border border-white/10 text-xs font-semibold shadow-2xl transition-all hover:scale-105 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Episodes</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xl border border-white/10 transition-all hover:scale-105 cursor-pointer"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. TV Show Episodes Drawer */}
      {isEpisodeDrawerOpen && (
        <div className="absolute inset-y-0 right-0 z-40 w-full max-w-md bg-[#14151b]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Episodes</h3>
              <p className="text-xs text-zinc-400">{title}</p>
            </div>
            <button
              onClick={() => setIsEpisodeDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Season Selector Tabs */}
          {seasons.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeasonNum(s.season_number)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                    selectedSeasonNum === s.season_number
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  Season {s.season_number}
                </button>
              ))}
            </div>
          )}

          {/* Episode List */}
          <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-2.5">
            {isSeasonLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                <span>Loading episodes...</span>
              </div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              seasonData.episodes.map((ep: TMDBEpisode) => {
                const isCurrent = season === selectedSeasonNum && episode === ep.episode_number;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      router.push(`/watch/${type}/${id}?season=${selectedSeasonNum}&episode=${ep.episode_number}`);
                      setIsEpisodeDrawerOpen(false);
                      setIsPlayerLoading(true);
                      setReloadKey((k) => k + 1);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group cursor-pointer border',
                      isCurrent
                        ? 'bg-red-600/15 border-red-600/50'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/15'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                      {ep.still_path ? (
                        <Image
                          src={getImageUrl(ep.still_path, 'w300')}
                          alt={ep.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                          EP {ep.episode_number}
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {ep.episode_number}. {ep.name}
                        </span>
                      </div>
                      {ep.runtime && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">{ep.runtime}m</p>
                      )}
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                        {ep.overview || 'No description available.'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No episodes found for this season.
              </div>
            )}
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
        <div className="fixed inset-0 w-screen h-screen bg-[#0f1014] z-50 flex items-center justify-center text-white text-xs">
          Loading player...
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
