'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  RefreshCw,
  Maximize,
  Minimize,
  Layers,
  Play,
  Check,
  Server,
  SkipForward,
  SkipBack,
  AlertCircle,
} from 'lucide-react';
import { getMovieDetails, getTVDetails, getTVSeason, getImageUrl, isNotFoundError } from '@/lib/tmdb';
import { TMDBMovieDetails, TMDBTVDetails, TMDBSeason, TMDBEpisode } from '@/types/tmdb';
import { STREAMING_SERVERS, getServer, getPlayerUrlForServer } from '@/lib/playerSources';
import { useUserStoreSelector, userStoreActions } from '@/lib/store';
import { usePlayerProgress } from '@/lib/usePlayerProgress';
import { Modal } from '@/components/ui/Modal';
import { Chip } from '@/components/ui/Chip';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { GLASS } from '@/lib/styles';

const CONTROLS_HIDE_MS = 3500;
const SLOW_LOAD_MS = 12000;
const AUTO_NEXT_SECONDS = 10;

function parsePositiveInt(value: string | null, fallback = 1): number {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const pillClass = cn(
  'flex items-center gap-2 h-11 px-4 rounded-full text-white text-sm font-semibold transition-[filter,background-color] duration-300 hover:brightness-125',
  GLASS
);

function WatchContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const rawType = routeParams?.type as string;
  if (rawType !== 'movie' && rawType !== 'tv') notFound();
  const type: 'movie' | 'tv' = rawType;
  const id = (routeParams?.id as string) || '';

  const season = parsePositiveInt(searchParams.get('season'));
  const episode = parsePositiveInt(searchParams.get('episode'));

  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [loadError, setLoadError] = useState<'not-found' | 'failed' | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  // Resume position, tagged with the episode it belongs to so a stale value is never used
  const [resume, setResume] = useState<{ key: string; at?: number } | null>(null);
  const episodeKey = `${id}-${season}-${episode}`;

  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
  const [isServerSheetOpen, setIsServerSheetOpen] = useState(false);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(season);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [nextUpCountdown, setNextUpCountdown] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const currentEpisodeRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayOpenRef = useRef(false);

  const preferredServerId = useUserStoreSelector((s) => s.preferredServerId);
  const server = getServer(preferredServerId);

  // 1. Load title details (only when the title changes — not on episode switches)
  useEffect(() => {
    if (!id) return;
    let ignore = false;
    setDetails(null);
    setLoadError(null);

    (type === 'movie' ? getMovieDetails(id) : getTVDetails(id))
      .then((res) => {
        if (!ignore) setDetails(res);
      })
      .catch((err) => {
        if (ignore) return;
        console.error('Failed to load media details:', err);
        setLoadError(isNotFoundError(err) ? 'not-found' : 'failed');
      });

    return () => {
      ignore = true;
    };
  }, [type, id, retryKey]);

  // 2. Record the play in history and work out the resume position for this episode
  useEffect(() => {
    if (!details) return;
    const existing = userStoreActions
      .getSnapshot()
      .history.find((h) => h.id === details.id && h.type === type);
    const sameEpisode = type === 'movie' || (existing?.season === season && existing?.episode === episode);
    setResume({
      key: `${id}-${season}-${episode}`,
      at: sameEpisode && existing && !existing.finished ? existing.progressSeconds : undefined,
    });
    setNextUpCountdown(null);

    userStoreActions.startWatching({
      id: details.id,
      type,
      title: (type === 'movie' ? details.title : details.name) || 'Untitled',
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average,
      release_date: type === 'movie' ? details.release_date : details.first_air_date,
      ...(type === 'tv' ? { season, episode } : {}),
    });
  }, [details, type, id, season, episode]);

  // 3. Season data for the episode drawer
  useEffect(() => {
    if (type !== 'tv' || !id || !isEpisodeDrawerOpen) return;
    let ignore = false;
    setIsSeasonLoading(true);
    getTVSeason(id, selectedSeasonNum)
      .then((res) => {
        if (!ignore) setSeasonData(res);
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load season episodes:', err);
          setSeasonData(null);
        }
      })
      .finally(() => {
        if (!ignore) setIsSeasonLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [type, id, selectedSeasonNum, isEpisodeDrawerOpen]);

  // Bring the playing episode into view when the drawer opens
  useEffect(() => {
    if (isEpisodeDrawerOpen && !isSeasonLoading) {
      currentEpisodeRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [isEpisodeDrawerOpen, isSeasonLoading, seasonData]);

  // Episode navigation derived from the season list (no extra requests)
  const seasons = useMemo(
    () => (type === 'tv' ? ((details as TMDBTVDetails | null)?.seasons || []).filter((s) => s.season_number > 0) : []),
    [details, type]
  );

  const { prevEpisode, nextEpisode } = useMemo(() => {
    if (type !== 'tv' || seasons.length === 0) return { prevEpisode: null, nextEpisode: null };
    const idx = seasons.findIndex((s) => s.season_number === season);
    const current = seasons[idx];
    let next: { season: number; episode: number } | null = null;
    let prev: { season: number; episode: number } | null = null;

    if (current && episode < current.episode_count) next = { season, episode: episode + 1 };
    else if (idx >= 0 && seasons[idx + 1]) next = { season: seasons[idx + 1].season_number, episode: 1 };

    if (episode > 1) prev = { season, episode: episode - 1 };
    else if (idx > 0 && seasons[idx - 1]) {
      prev = { season: seasons[idx - 1].season_number, episode: Math.max(1, seasons[idx - 1].episode_count) };
    }
    return { prevEpisode: prev, nextEpisode: next };
  }, [type, seasons, season, episode]);

  const goToEpisode = useCallback(
    (s: number, e: number) => {
      setIsEpisodeDrawerOpen(false);
      setNextUpCountdown(null);
      router.push(`/watch/tv/${id}?season=${s}&episode=${e}`);
    },
    [router, id]
  );

  // Playback progress reported by the embed
  usePlayerProgress(server, {
    onProgress: ({ currentTime, duration }) => {
      if (details) userStoreActions.updateProgress(details.id, type, currentTime, duration);
    },
    onEnded: () => {
      if (!details) return;
      userStoreActions.markFinished(details.id, type);
      if (nextEpisode) setNextUpCountdown(AUTO_NEXT_SECONDS);
    },
  });

  // Auto-next countdown
  useEffect(() => {
    if (nextUpCountdown === null) return;
    if (nextUpCountdown <= 0) {
      if (nextEpisode) goToEpisode(nextEpisode.season, nextEpisode.episode);
      return;
    }
    const t = setTimeout(() => setNextUpCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [nextUpCountdown, nextEpisode, goToEpisode]);

  // Controls auto-hide. The cross-origin iframe swallows pointer events, so a
  // transparent hot-zone at the top (rendered while hidden) brings them back.
  useEffect(() => {
    overlayOpenRef.current = isEpisodeDrawerOpen || isServerSheetOpen || nextUpCountdown !== null;
  });

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (overlayOpenRef.current || headerRef.current?.contains(document.activeElement)) return;
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [revealControls]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null;
    if (!el) return;
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
    try {
      if (!document.fullscreenElement) {
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
      } else {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  }, []);

  // Keyboard shortcuts (only when focus is on our page, not inside the embed)
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (overlayOpenRef.current && e.key !== 'Escape') return;
      revealControls();
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 'n' && nextEpisode) {
        goToEpisode(nextEpisode.season, nextEpisode.episode);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen, revealControls, nextEpisode, goToEpisode]);

  const playerUrl = getPlayerUrlForServer(server.id, type, id, season, episode, {
    startAt: resume?.at,
    autoplay: true,
  });
  const iframeKey = `${playerUrl}|${reloadKey}`;
  const isPlayerLoading = loadedKey !== iframeKey;
  const isSlow = isPlayerLoading && slowKey === iframeKey;

  useEffect(() => {
    const t = setTimeout(() => setSlowKey(iframeKey), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [iframeKey]);

  const currentIndex = STREAMING_SERVERS.findIndex((s) => s.id === server.id);
  const fallbackServer = STREAMING_SERVERS[(currentIndex + 1) % STREAMING_SERVERS.length];
  const hasAlternatives = STREAMING_SERVERS.length > 1;

  const handleServerChange = (serverId: string) => {
    setIsServerSheetOpen(false);
    if (serverId === server.id) return;
    userStoreActions.setPreferredServerId(serverId);
    toast(`Switched to ${getServer(serverId).name}`, { tone: 'info' });
  };

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-bg z-[var(--z-player)] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-10 h-10 text-accent mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white mb-2">
          {loadError === 'not-found' ? 'Title not found' : "Couldn't load this title"}
        </h1>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">
          {loadError === 'not-found'
            ? 'This movie or show does not exist or was removed.'
            : 'Check your connection and try again.'}
        </p>
        <div className="flex gap-3">
          {loadError === 'failed' && (
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          )}
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  if (!details || resume?.key !== episodeKey) {
    return (
      <div
        className="fixed inset-0 bg-bg z-[var(--z-player)] flex flex-col items-center justify-center gap-4"
        role="status"
      >
        <div className="w-12 h-12 rounded-full border-t-accent animate-spin" aria-hidden="true" />
        <p className="text-sm font-semibold text-white">Loading player…</p>
      </div>
    );
  }

  const title = (type === 'movie' ? details.title : details.name) || 'Untitled';

  return (
    <div
      ref={containerRef}
      onPointerMove={revealControls}
      className="fixed inset-0 bg-black z-[var(--z-player)] overflow-hidden select-none"
    >
      <h1 className="sr-only">
        Watching {title}
        {type === 'tv' ? `, season ${season} episode ${episode}` : ''}
      </h1>

      <iframe
        key={iframeKey}
        src={playerUrl}
        title={`${title} player`}
        onLoad={() => setLoadedKey(iframeKey)}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="origin"
        className="w-full h-full absolute inset-0 z-0 bg-black"
      />

      {/* Loading overlay */}
      {isPlayerLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-4 text-center bg-bg animate-fade-in">
          {details.backdrop_path && (
            <Image
              src={getImageUrl(details.backdrop_path, 'w780')}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-25 scale-110 blur-2xl"
              aria-hidden="true"
            />
          )}
          <div className="relative w-14 h-14 rounded-full border-4 border-white/15 border-t-accent animate-spin" aria-hidden="true" />
          <div role="status" className="relative">
            <p className="font-display text-xl sm:text-2xl font-bold text-white">{title}</p>
            <p className="text-sm text-muted mt-1">
              {type === 'tv' ? `Season ${season} · Episode ${episode} · ` : ''}
              {isSlow ? 'Taking longer than usual' : 'Loading player…'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (hasAlternatives ? handleServerChange(fallbackServer.id) : setReloadKey((k) => k + 1))}
            className={cn(
              'relative h-10 px-5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2',
              isSlow ? 'bg-accent hover:bg-accent-hover text-on-accent' : 'bg-white/10 hover:bg-white/15 text-white'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            {hasAlternatives ? `Try ${fallbackServer.name}` : 'Reload player'}
          </button>
        </div>
      )}

      {/* Invisible hot-zone that re-reveals controls over the iframe (mouse + touch) */}
      {!controlsVisible && (
        <button
          type="button"
          aria-label="Show player controls"
          onPointerEnter={revealControls}
          onClick={revealControls}
          className="absolute top-0 inset-x-0 h-20 z-20 bg-transparent focus:outline-none"
        />
      )}

      {/* Top controls */}
      <div
        ref={headerRef}
        onFocusCapture={revealControls}
        className={cn(
          'absolute top-0 inset-x-0 z-30 px-4 py-4 sm:px-8 sm:py-6 flex items-start sm:items-center justify-between gap-3 transition-opacity duration-300 bg-gradient-to-b from-black/70 via-black/25 to-transparent',
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href={`/details/${type}/${id}`} className={pillClass} aria-label={`Back to ${title} details`}>
            <ArrowLeft className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Details</span>
          </Link>
          <div className={cn('flex items-center gap-2 h-11 px-4 rounded-full min-w-0', GLASS)}>
            <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[360px]">{title}</span>
            {type === 'tv' && (
              <span className="px-2 py-0.5 rounded-md text-on-accent text-[11px] font-bold bg-accent tracking-wide flex-shrink-0">
                S{season} · E{episode}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {prevEpisode && (
            <button
              type="button"
              onClick={() => goToEpisode(prevEpisode.season, prevEpisode.episode)}
              className={cn(pillClass, 'hidden sm:flex')}
              aria-label={`Previous episode: S${prevEpisode.season} E${prevEpisode.episode}`}
            >
              <SkipBack className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          {nextEpisode && (
            <button
              type="button"
              onClick={() => goToEpisode(nextEpisode.season, nextEpisode.episode)}
              className={pillClass}
              aria-label={`Next episode: S${nextEpisode.season} E${nextEpisode.episode}`}
              title="Next episode (N)"
            >
              <SkipForward className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">Next</span>
            </button>
          )}
          {type === 'tv' && seasons.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedSeasonNum(season);
                setIsEpisodeDrawerOpen(true);
              }}
              className={pillClass}
              aria-label="Episodes"
            >
              <Layers className="w-4 h-4 text-accent" aria-hidden="true" />
              <span className="hidden md:inline">Episodes</span>
            </button>
          )}
          {hasAlternatives && (
            <button
              type="button"
              onClick={() => setIsServerSheetOpen(true)}
              className={pillClass}
              aria-label={`Change server (current: ${server.name})`}
            >
              <Server className="w-4 h-4 text-accent" aria-hidden="true" />
              <span className="hidden md:inline">{server.name}</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={cn(pillClass, 'px-2.5')}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Auto-next card */}
      {nextUpCountdown !== null && nextEpisode && (
        <div
          role="alertdialog"
          aria-label="Next episode"
          className={cn(
            'absolute bottom-6 right-4 sm:right-8 z-30 w-[calc(100%-2rem)] max-w-sm p-5 rounded-panel overflow-hidden animate-slide-up',
            GLASS
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Up next</p>
          <p className="font-display text-lg font-bold text-white mt-1">
            Season {nextEpisode.season} · Episode {nextEpisode.episode}
          </p>
          <span className="absolute bottom-0 inset-x-0 h-1 bg-white/10" aria-hidden="true">
            <span
              key={`${nextEpisode.season}-${nextEpisode.episode}`}
              className="block h-full w-full bg-accent hero-progress"
              style={{ '--hero-duration': `${AUTO_NEXT_SECONDS}s` } as React.CSSProperties}
            />
          </span>
          <p className="sr-only" aria-live="polite">
            Playing in {nextUpCountdown} seconds
          </p>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => goToEpisode(nextEpisode.season, nextEpisode.episode)}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-accent text-on-accent text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              Play now ({nextUpCountdown})
            </button>
            <button
              type="button"
              onClick={() => setNextUpCountdown(null)}
              className="h-10 px-4 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Server picker */}
      <Modal
        isOpen={isServerSheetOpen}
        onClose={() => setIsServerSheetOpen(false)}
        title="Choose a server"
        description="If a video doesn't play, try another server."
        className="max-w-md"
      >
        <ul className="space-y-2">
          {STREAMING_SERVERS.map((s) => {
            const active = s.id === server.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleServerChange(s.id)}
                  aria-pressed={active}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 p-3 rounded-control text-left transition-colors',
                    active ? 'bg-accent/15 border-accent/50' : 'bg-white/[0.03] hover:bg-white/[0.07]'
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">{s.name}</span>
                    <span className="block text-xs text-zinc-400">{s.badge}</span>
                  </span>
                  {active && <Check className="w-4 h-4 text-accent" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            setReloadKey((k) => k + 1);
            setIsServerSheetOpen(false);
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Reload player
        </button>
      </Modal>

      {/* Episode drawer */}
      {type === 'tv' && (
        <Modal
          isOpen={isEpisodeDrawerOpen}
          onClose={() => setIsEpisodeDrawerOpen(false)}
          title="Episodes"
          description={title}
          variant="drawer"
        >
          {seasons.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar flex-shrink-0" role="group" aria-label="Season">
              {seasons.map((s) => (
                <Chip key={s.id} selected={selectedSeasonNum === s.season_number} onClick={() => setSelectedSeasonNum(s.season_number)}>
                  Season {s.season_number}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {isSeasonLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[84px] rounded-panel bg-white/[0.04] animate-pulse" />
              ))
            ) : seasonData?.episodes?.length ? (
              seasonData.episodes.map((ep: TMDBEpisode) => {
                const isCurrent = season === selectedSeasonNum && episode === ep.episode_number;
                return (
                  <button
                    key={ep.id}
                    ref={isCurrent ? currentEpisodeRef : undefined}
                    type="button"
                    onClick={() => goToEpisode(selectedSeasonNum, ep.episode_number)}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={cn(
                      'relative w-full flex items-center gap-4 p-2.5 pl-3 rounded-panel text-left transition-colors group',
                      isCurrent ? 'bg-accent/15' : 'hover:bg-white/[0.06]'
                    )}
                  >
                    {isCurrent && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-accent" aria-hidden="true" />}
                    <div className="relative w-32 aspect-video rounded-md overflow-hidden bg-black/40 flex-shrink-0">
                      {ep.still_path ? (
                        <Image
                          src={getImageUrl(ep.still_path, 'w300')}
                          alt=""
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-subtle text-xs">
                          EP {ep.episode_number}
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-accent/30 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-white truncate">
                        {ep.episode_number}. {ep.name}
                      </span>
                      <span className={cn('block text-xs mt-0.5', isCurrent ? 'text-accent font-semibold' : 'text-subtle')}>
                        {isCurrent ? 'Now playing' : ep.runtime ? `${ep.runtime}m` : ''}
                      </span>
                      <span className="block text-xs text-muted line-clamp-2 mt-1">
                        {ep.overview || 'No description available.'}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center py-12 text-zinc-400 text-sm">No episodes found for this season.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-bg z-[var(--z-player)] flex items-center justify-center text-white text-sm">
          Loading player…
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
