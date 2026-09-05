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
  Subtitles,
  ExternalLink,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  X,
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

  const [activeServer, setActiveServer] = useState<string>(preferredServerId || 'vidlink');
  const [customStreamUrl, setCustomStreamUrl] = useState<string>('');
  const [isCustomStreamActive, setIsCustomStreamActive] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isAllServersModalOpen, setIsAllServersModalOpen] = useState(false);
  const [customInputVal, setCustomInputVal] = useState('');

  // Scroll container ref for server buttons
  const serverScrollRef = useRef<HTMLDivElement>(null);

  // Iframe player states
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Sync with preferredServerId
  useEffect(() => {
    if (preferredServerId && !isCustomStreamActive) {
      setActiveServer(preferredServerId);
    }
  }, [preferredServerId, isCustomStreamActive]);

  // Server selection handler
  const handleServerChange = (serverId: string) => {
    setIsCustomStreamActive(false);
    setActiveServer(serverId);
    setPreferredServerId(serverId);
    setIsIframeLoading(true);
    setIsAllServersModalOpen(false);
  };

  // Scroll helper buttons
  const scrollServers = (direction: 'left' | 'right') => {
    if (!serverScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    serverScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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

  const handleApplyCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputVal.trim()) return;
    setCustomStreamUrl(customInputVal.trim());
    setIsCustomStreamActive(true);
    setIsCustomModalOpen(false);
  };

  const currentIframeUrl = getPlayerUrlForServer(activeServer, type, tmdbId, season, episode);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Multi-Server Switcher Bar with Scroll Arrows & View All Button */}
      <div className="flex items-center justify-between gap-2 pb-1">
        {/* Scrollable Container with Left/Right Scroll Controls */}
        <div className="relative flex-1 flex items-center min-w-0">
          {/* Scroll Left Button */}
          <button
            onClick={() => scrollServers('left')}
            title="Scroll servers left"
            className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors mr-1.5 flex-shrink-0 cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Server Pills Row */}
          <div
            ref={serverScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth no-scrollbar scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Active Verified Servers */}
            {STREAMING_SERVERS.map((server) => {
              const isSelected = activeServer === server.id && !isCustomStreamActive;
              return (
                <button
                  key={server.id}
                  onClick={() => handleServerChange(server.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm flex-shrink-0 whitespace-nowrap',
                    isSelected
                      ? 'bg-red-600 text-white border-red-500 shadow-red-600/30 font-bold'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                  )}
                >
                  <Server className="w-3 h-3" />
                  <span>{server.name}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-bold',
                      isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {server.badge}
                  </span>
                </button>
              );
            })}

            {/* Custom Stream / ArtPlayer Option */}
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm flex-shrink-0 whitespace-nowrap',
                isCustomStreamActive
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-600/30'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-purple-400 hover:text-purple-300 border-zinc-800'
              )}
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span>🎨 Direct Stream (ArtPlayer)</span>
              {isCustomStreamActive && (
                <span className="text-[10px] bg-black/40 text-purple-200 px-1.5 rounded font-bold">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollServers('right')}
            title="Scroll servers right"
            className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors ml-1.5 flex-shrink-0 cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 'View All Servers' Popover Modal Button */}
        <button
          onClick={() => setIsAllServersModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm flex-shrink-0 whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5 text-red-500" />
          <span>All Servers ({STREAMING_SERVERS.length})</span>
        </button>
      </div>

      {/* Main Video Cinema Screen */}
      {isCustomStreamActive && customStreamUrl ? (
        <ArtPlayerCinema
          type={type}
          tmdbId={tmdbId}
          season={season}
          episode={episode}
          title={title}
          streamUrl={customStreamUrl}
          subtitles={[]}
          backdropPath={backdropPath}
          isTheaterMode={isTheaterMode}
          onToggleTheater={onToggleTheater}
          onStreamError={() => {
            setIsCustomStreamActive(false);
            setActiveServer('vidlink');
          }}
        />
      ) : (
        /* High-Speed Instant Cinema Stream Player */
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
                  <p className="text-sm font-bold text-white">Connecting Cinema Stream...</p>
                  <p className="text-xs text-zinc-400">{title} • High Definition Fast Server</p>
                </div>
              </div>
            )}

            <iframe
              key={`${currentIframeUrl}-${iframeReloadKey}`}
              src={currentIframeUrl}
              title={`Cinema Stream Player - ${title}`}
              onLoad={() => setIsIframeLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads"
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-zinc-400">
                Active Stream: {activeServer.toUpperCase()} HD • Auto-Subtitles & Audio
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
              <span>Reload Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* 'All Streaming Servers' Modal Selector */}
      {isAllServersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#090d16] border border-zinc-700 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Select Cinema Streaming Server</span>
              </h3>
              <button
                onClick={() => setIsAllServersModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select a streaming source from the cluster. If any server buffers or encounters regional blocks, simply choose another server below.
            </p>

            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {STREAMING_SERVERS.map((server, index) => {
                const isSelected = activeServer === server.id && !isCustomStreamActive;
                return (
                  <button
                    key={server.id}
                    onClick={() => handleServerChange(server.id)}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                      isSelected
                        ? 'bg-red-600/15 border-red-500/60 text-white shadow-lg shadow-red-950/30'
                        : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800 text-zinc-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                          isSelected ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{server.name}</span>
                          {isSelected && <span className="text-[10px] text-red-400 font-semibold">• Active</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{server.badge}</div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-red-500" />}
                  </button>
                );
              })}

              {/* Direct Stream ArtPlayer Option in Modal */}
              <button
                onClick={() => {
                  setIsAllServersModalOpen(false);
                  setIsCustomModalOpen(true);
                }}
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  isCustomStreamActive
                    ? 'bg-purple-600/15 border-purple-500/60 text-white shadow-lg shadow-purple-950/30'
                    : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800 text-zinc-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                      isCustomStreamActive ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-purple-400'
                    )}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">🎨 Direct Stream (ArtPlayer)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Custom .m3u8 / .mp4 URL with Subtitle Sync</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Stream / ArtPlayer Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#090d16] border border-zinc-700 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Load Direct Video in ArtPlayer</span>
              </h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste any direct <code className="text-purple-300">.m3u8</code> (HLS) or <code className="text-purple-300">.mp4</code> video link to play it with ArtPlayer, custom subtitle delay sync, and full UI customization.
            </p>

            <form onSubmit={handleApplyCustomStream} className="flex flex-col gap-3">
              <input
                type="url"
                required
                placeholder="https://example.com/stream.m3u8 or .mp4"
                value={customInputVal}
                onChange={(e) => setCustomInputVal(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Launch in ArtPlayer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
