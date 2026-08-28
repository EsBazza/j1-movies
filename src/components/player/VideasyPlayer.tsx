'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize,
  Minimize,
  Shield,
  Tv,
  Sparkles,
  Server,
  ChevronDown,
} from 'lucide-react';
import { STREAMING_SERVERS, getPlayerUrlForServer } from '@/lib/playerSources';
import { useUserStore } from '@/lib/store';
import { MediaType } from '@/types/tmdb';
import { cn } from '@/lib/utils';

interface VideasyPlayerProps {
  type: MediaType;
  tmdbId: number | string;
  season?: number;
  episode?: number;
  title: string;
  backdropPath?: string | null;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export function VideasyPlayer({
  type,
  tmdbId,
  season = 1,
  episode = 1,
  title,
  backdropPath,
  isTheaterMode = false,
  onToggleTheater,
}: VideasyPlayerProps) {
  const { preferredServerId, setPreferredServerId } = useUserStore();
  const [currentServerId, setCurrentServerId] = useState<string>(preferredServerId || 'videasy');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeServer = STREAMING_SERVERS.find((s) => s.id === currentServerId) || STREAMING_SERVERS[0];
  const playerUrl = getPlayerUrlForServer(currentServerId, type, tmdbId, season, episode);

  const handleServerChange = (serverId: string) => {
    setCurrentServerId(serverId);
    setPreferredServerId(serverId);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  // Fullscreen Request Handler
  const toggleFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        if (playerContainerRef.current.requestFullscreen) {
          await playerContainerRef.current.requestFullscreen();
        } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
          await (playerContainerRef.current as any).webkitRequestFullscreen();
        } else if ((playerContainerRef.current as any).msRequestFullscreen) {
          await (playerContainerRef.current as any).msRequestFullscreen();
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

  // Listen for Fullscreen Change & Keyboard Shortcuts (F, T)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 't' && onToggleTheater) {
        e.preventDefault();
        onToggleTheater();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen, onToggleTheater]);

  return (
    <div className="relative w-full flex flex-col group">
      {/* Ambient Ambilight Glow Effect behind the cinema player */}
      <div className="absolute -inset-2 bg-gradient-to-r from-red-600/20 via-rose-600/10 to-blue-600/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none -z-10" />

      {/* Main Video Cinema Container */}
      <div
        ref={playerContainerRef}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        className={cn(
          'relative w-full bg-black overflow-hidden shadow-2xl shadow-black transition-all duration-300',
          isFullscreen
            ? 'fixed inset-0 z-50 h-screen w-screen rounded-none flex items-center justify-center'
            : isTheaterMode
            ? 'aspect-[21/9] min-h-[480px] max-h-[75vh] rounded-2xl border border-red-500/20 shadow-red-950/20'
            : 'aspect-video rounded-2xl border border-zinc-800/80 hover:border-zinc-700'
        )}
      >
        {/* Loading Spinner with Cinema Vibe */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#07090e]/95 backdrop-blur-md gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-red-600/20 border-t-red-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-bold text-white tracking-wide">
                Buffering Cinema Stream ({activeServer.name})
              </p>
              <p className="text-xs text-zinc-400 max-w-xs text-center">
                {title} • {type === 'tv' ? `Season ${season}, Episode ${episode}` : 'Feature Film'}
              </p>
            </div>
          </div>
        )}

        {/* Video Embed Iframe with Fullscreen Permissions */}
        <iframe
          ref={iframeRef}
          key={`${playerUrl}-${reloadKey}`}
          src={playerUrl}
          title={`Cinema player - ${title}`}
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *; display-capture"
          allowFullScreen={true}
          className="w-full h-full border-0 relative z-0"
        />

        {/* Floating In-Player Cinema Toolbar Overlay (Hover / Fullscreen) */}
        <div
          className={cn(
            'absolute top-4 right-4 z-20 flex items-center gap-2 transition-opacity duration-300 pointer-events-auto',
            showControls || isFullscreen ? 'opacity-100' : 'opacity-0'
          )}
        >
          {onToggleTheater && !isFullscreen && (
            <button
              onClick={onToggleTheater}
              title="Toggle Theater Mode [T]"
              className="p-2.5 rounded-xl bg-black/75 hover:bg-red-600 text-white border border-white/10 backdrop-blur-md transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              <Tv className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen [Esc or F]' : 'Enter Cinema Fullscreen [F]'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/40 border border-red-400/30 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4" />
                <span>Fullscreen [F]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Under-Player Server Switcher & Controls Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3.5 px-1 text-xs text-zinc-400">
        {/* Server Provider Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-zinc-400 mr-1">
            <Server className="w-3.5 h-3.5 text-red-500" />
            <span className="font-semibold text-zinc-300">Server:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {STREAMING_SERVERS.map((server) => {
              const isActive = server.id === currentServerId;
              return (
                <button
                  key={server.id}
                  onClick={() => handleServerChange(server.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                    isActive
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40 scale-105'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  )}
                >
                  <span>{server.name.split(' ')[0]} {server.name.split(' ')[1]}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-md font-mono',
                      isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {server.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-md',
                isTheaterMode
                  ? 'bg-red-600/20 text-red-400 border-red-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              )}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{isTheaterMode ? 'Default' : 'Theater'}</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Exit [Esc]</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>Fullscreen [F]</span>
              </>
            )}
          </button>

          <button
            onClick={handleReload}
            title="Reload Video Stream"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
