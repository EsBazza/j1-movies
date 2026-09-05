'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Server,
  Zap,
  RefreshCw,
  Maximize,
  Minimize,
  Tv,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { MediaType } from '@/types/tmdb';
import { STREAMING_SERVERS, getPlayerUrlForServer } from '@/lib/playerSources';
import { SubtitleTrack, StreamResolutionResponse } from '@/app/api/stream/[...path]/route';
import { ArtPlayerCinema } from './ArtPlayerCinema';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface UnifiedCinemaPlayerProps {
  type: MediaType;
  tmdbId: number | string;
  season?: number;
  episode?: number;
  title: string;
  backdropPath?: string | null;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export function UnifiedCinemaPlayer({
  type,
  tmdbId,
  season = 1,
  episode = 1,
  title,
  backdropPath,
  isTheaterMode = false,
  onToggleTheater,
}: UnifiedCinemaPlayerProps) {
  const { preferredServerId, setPreferredServerId } = useUserStore();

  const [activeServer, setActiveServer] = useState<string>('native');
  const [streamData, setStreamData] = useState<StreamResolutionResponse | null>(null);
  const [isResolvingNative, setIsResolvingNative] = useState(true);
  const [nativeFailed, setNativeFailed] = useState(false);

  // Iframe player states
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Attempt resolving direct stream when media changes
  useEffect(() => {
    let isCancelled = false;

    async function resolveStream() {
      setIsResolvingNative(true);
      setNativeFailed(false);

      try {
        const queryParams = type === 'tv' ? `?season=${season}&episode=${episode}` : '';
        const res = await fetch(`/api/stream/${type}/${tmdbId}${queryParams}`);
        const data: StreamResolutionResponse = await res.json();

        if (isCancelled) return;

        if (data.success && data.streamUrl) {
          setStreamData(data);
          setActiveServer('native');
        } else {
          setNativeFailed(true);
          // Fallback to Videasy if native stream is not available
          setActiveServer(preferredServerId && preferredServerId !== 'native' ? preferredServerId : 'videasy');
        }
      } catch (err) {
        console.warn('Stream resolver error, activating fallback server:', err);
        if (!isCancelled) {
          setNativeFailed(true);
          setActiveServer('videasy');
        }
      } finally {
        if (!isCancelled) {
          setIsResolvingNative(false);
        }
      }
    }

    resolveStream();

    return () => {
      isCancelled = true;
    };
  }, [type, tmdbId, season, episode, preferredServerId]);

  // Server selection handler
  const handleServerChange = (serverId: string) => {
    setActiveServer(serverId);
    setPreferredServerId(serverId);
    setIsIframeLoading(true);
  };

  // Fullscreen for Iframe Fallback Mode
  const toggleIframeFullscreen = useCallback(async () => {
    if (!iframeContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (iframeContainerRef.current.requestFullscreen) {
          await iframeContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsIframeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentIframeUrl = getPlayerUrlForServer(activeServer, type, tmdbId, season, episode);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Multi-Server Switcher Pill Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {/* Native ArtPlayer Server Option */}
          <button
            onClick={() => handleServerChange('native')}
            disabled={nativeFailed}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-md flex-shrink-0',
              activeServer === 'native'
                ? 'bg-red-600 text-white border-red-500 shadow-red-600/30'
                : nativeFailed
                ? 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50 cursor-not-allowed line-through'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            )}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Native HD (ArtPlayer)</span>
            {!nativeFailed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-amber-300 font-extrabold uppercase">
                Fastest
              </span>
            )}
          </button>

          {/* Fallback Embed Servers */}
          {STREAMING_SERVERS.map((server) => (
            <button
              key={server.id}
              onClick={() => handleServerChange(server.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm flex-shrink-0',
                activeServer === server.id
                  ? 'bg-red-600 text-white border-red-500 shadow-red-600/30'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
              )}
            >
              <Server className="w-3 h-3" />
              <span>{server.name}</span>
              <span className="text-[10px] text-zinc-400 bg-black/30 px-1 rounded">
                {server.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Video Cinema Screen */}
      {activeServer === 'native' && streamData?.streamUrl ? (
        <ArtPlayerCinema
          type={type}
          tmdbId={tmdbId}
          season={season}
          episode={episode}
          title={title}
          streamUrl={streamData.streamUrl}
          subtitles={streamData.subtitles || []}
          backdropPath={backdropPath}
          isTheaterMode={isTheaterMode}
          onToggleTheater={onToggleTheater}
          onStreamError={() => {
            setNativeFailed(true);
            setActiveServer('videasy');
          }}
        />
      ) : isResolvingNative && activeServer === 'native' ? (
        <div
          className={cn(
            'relative w-full bg-black rounded-2xl border border-zinc-800 flex flex-col items-center justify-center p-8 gap-4',
            isTheaterMode ? 'aspect-[21/9] min-h-[480px]' : 'aspect-video'
          )}
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-red-600/20 border-t-red-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Initializing ArtPlayer Native Stream...</p>
            <p className="text-xs text-zinc-400 mt-1">Extracting high-speed HLS chunks & subtitle tracks</p>
          </div>
        </div>
      ) : (
        /* Fallback Iframe Embed Player */
        <div className="relative w-full flex flex-col group">
          <div className="absolute -inset-2 bg-gradient-to-r from-red-600/20 via-rose-600/10 to-blue-600/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none -z-10" />

          <div
            ref={iframeContainerRef}
            className={cn(
              'relative w-full bg-black overflow-hidden shadow-2xl shadow-black transition-all duration-300',
              isIframeFullscreen
                ? 'fixed inset-0 z-50 h-screen w-screen rounded-none flex items-center justify-center'
                : isTheaterMode
                ? 'aspect-[21/9] min-h-[480px] max-h-[78vh] rounded-2xl border border-red-500/30 shadow-red-950/25'
                : 'aspect-video rounded-2xl border border-zinc-800/90 hover:border-zinc-700'
            )}
          >
            {isIframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#07090e]/95 backdrop-blur-md gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-red-600/20 border-t-red-600 animate-spin" />
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-bold text-white">Connecting to {activeServer.toUpperCase()} Server...</p>
                  <p className="text-xs text-zinc-400">{title}</p>
                </div>
              </div>
            )}

            <iframe
              key={`${currentIframeUrl}-${iframeReloadKey}`}
              src={currentIframeUrl}
              title={`Cinema Embed Player - ${title}`}
              onLoad={() => setIsIframeLoading(false)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *; display-capture"
              allowFullScreen={true}
              className="w-full h-full border-0 relative z-0"
            />

            {/* Iframe Action Overlays */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
              {onToggleTheater && !isIframeFullscreen && (
                <button
                  onClick={onToggleTheater}
                  className="px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md bg-black/75 hover:bg-zinc-800 text-zinc-200 border border-white/10 transition-all hover:scale-105 cursor-pointer shadow-xl flex items-center gap-1.5"
                >
                  <Tv className="w-4 h-4" />
                  <span>{isTheaterMode ? 'Default View' : 'Theater [T]'}</span>
                </button>
              )}

              <button
                onClick={toggleIframeFullscreen}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/40 border border-red-400/30 backdrop-blur-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                {isIframeFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                <span>{isIframeFullscreen ? 'Exit [Esc]' : 'Fullscreen [F]'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 px-1 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-medium text-zinc-400">
                Fallback Embed Server Active ({activeServer})
              </span>
            </div>

            <button
              onClick={() => {
                setIsIframeLoading(true);
                setIframeReloadKey((k) => k + 1);
              }}
              className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload Player</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
