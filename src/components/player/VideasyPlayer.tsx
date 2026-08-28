'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize,
  Minimize,
  Shield,
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
}

export function VideasyPlayer({
  type,
  tmdbId,
  season = 1,
  episode = 1,
  title,
}: VideasyPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const playerUrl = getVideasyPlayerUrl(type, tmdbId, season, episode, {
    color: 'e50914',
    autoplay: true,
    nextEpisode: true,
  });

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  // Fullscreen Listener & Toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
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
      console.error('Fullscreen error:', err);
    }
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* 16:9 Aspect Video Container */}
      <div
        ref={playerContainerRef}
        className={cn(
          'relative w-full bg-black overflow-hidden shadow-2xl shadow-black/80 transition-all',
          isFullscreen
            ? 'h-screen w-screen flex items-center justify-center'
            : 'aspect-video rounded-2xl border border-zinc-800/80'
        )}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm gap-3">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-sm font-medium text-zinc-300">
              Loading cinema stream for {title}...
            </p>
          </div>
        )}

        {/* Videasy Iframe Embed without sandbox restriction */}
        <iframe
          key={`${playerUrl}-${reloadKey}`}
          src={playerUrl}
          title={`Videasy player - ${title}`}
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          className="w-full h-full border-0 relative z-0"
        />

        {/* Fullscreen Floating Exit Button when in native container fullscreen */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-30 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            title="Exit Fullscreen"
          >
            <Minimize className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Under-Player Stream Helper & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2 text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span>Tip: Use an ad-blocker like uBlock Origin or Brave for an ad-free experience.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 transition-all hover:scale-105 cursor-pointer shadow-md"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>Cinema Fullscreen</span>
              </>
            )}
          </button>

          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload Stream</span>
          </button>
        </div>
      </div>
    </div>
  );
}
