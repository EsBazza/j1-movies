'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Loader2,
  RefreshCw,
  Maximize,
  Minimize,
  Sparkles,
  Tv,
} from 'lucide-react';
import { getVideasyPlayerUrl } from '@/lib/videasy';
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
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const playerUrl = getVideasyPlayerUrl(type, tmdbId, season, episode, {
    color: 'e50914',
    autoplay: true,
    nextEpisode: true,
  });

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
                Buffering Cinema Stream
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *; display-capture"
          allowFullScreen={true}
          className="w-full h-full border-0 relative z-0"
        />

        {/* Floating Top-Right Cinema Toolbar Overlay (Theater & Fullscreen Side-by-Side) */}
        <div
          className={cn(
            'absolute top-4 right-4 z-20 flex items-center gap-2 transition-opacity duration-300 pointer-events-auto',
            showControls || isFullscreen ? 'opacity-100' : 'opacity-0'
          )}
        >
          {onToggleTheater && !isFullscreen && (
            <button
              onClick={onToggleTheater}
              title={isTheaterMode ? 'Exit Theater Mode [T]' : 'Enter Theater Mode [T]'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all hover:scale-105 cursor-pointer shadow-xl',
                isTheaterMode
                  ? 'bg-red-600 text-white border-red-500 shadow-red-600/40'
                  : 'bg-black/75 hover:bg-zinc-800 text-zinc-200 border-white/10'
              )}
            >
              <Tv className="w-4 h-4" />
              <span>{isTheaterMode ? 'Default View' : 'Theater [T]'}</span>
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
                <span>Exit [Esc]</span>
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

      {/* Clean Under-Player Sub-Bar */}
      <div className="flex items-center justify-between pt-2.5 px-1 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-400">Videasy HD Stream</span>
        </div>

        <button
          onClick={handleReload}
          title="Reload Stream"
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-[11px]"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reload Player</span>
        </button>
      </div>
    </div>
  );
}
