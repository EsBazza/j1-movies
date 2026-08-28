'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getVideasyPlayerUrl } from '@/lib/videasy';
import { MediaType } from '@/types/tmdb';

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

  const playerUrl = getVideasyPlayerUrl(type, tmdbId, season, episode, {
    color: 'e50914',
    autoplay: true,
    nextEpisode: true,
  });

  const handleReload = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* 16:9 Aspect Video Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800/80 shadow-2xl shadow-black/80">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm gap-3">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-sm font-medium text-zinc-300">Loading stream for {title}...</p>
          </div>
        )}

        {/* Videasy Iframe Embed */}
        <iframe
          key={`${playerUrl}-${reloadKey}`}
          src={playerUrl}
          title={`Videasy player - ${title}`}
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          className="w-full h-full border-0 relative z-0"
        />
      </div>

      {/* Under-Player Stream Helper & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>If player doesn&apos;t load, check your internet or disable restrictive adblockers.</span>
        </div>

        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reload Player</span>
        </button>
      </div>
    </div>
  );
}
