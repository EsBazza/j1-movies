'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import {
  Sparkles,
  Subtitles,
  Sliders,
  Upload,
  RefreshCw,
  Maximize,
  Tv,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { MediaType } from '@/types/tmdb';
import { SubtitleTrack } from '@/app/api/stream/[...path]/route';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ArtPlayerCinemaProps {
  type: MediaType;
  tmdbId: number | string;
  season?: number;
  episode?: number;
  title: string;
  streamUrl: string;
  subtitles: SubtitleTrack[];
  backdropPath?: string | null;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  onStreamError?: () => void;
}

export function ArtPlayerCinema({
  type,
  tmdbId,
  season = 1,
  episode = 1,
  title,
  streamUrl,
  subtitles = [],
  backdropPath,
  isTheaterMode = false,
  onToggleTheater,
  onStreamError,
}: ArtPlayerCinemaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { saveProgress } = useUserStore();

  const [selectedSubLanguage, setSelectedSubLanguage] = useState<string>('none');
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [isSubtitlePanelOpen, setIsSubtitlePanelOpen] = useState(false);
  const [subFontSize, setSubFontSize] = useState<number>(24);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Initialize ArtPlayer instance
  useEffect(() => {
    if (!containerRef.current || !streamUrl) return;

    setPlayerError(null);

    // Initial subtitle track if available
    const defaultSub = subtitles.find((s) => s.isDefault) || subtitles[0];
    if (defaultSub && defaultSub.url) {
      setSelectedSubLanguage(defaultSub.language);
    }

    const art = new Artplayer({
      container: containerRef.current,
      url: streamUrl,
      type: 'm3u8',
      customType: {
        m3u8: (video: HTMLVideoElement, url: string, player: any) => {
          if (Hls.isSupported()) {
            if (player.hls) player.hls.destroy();
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 600,
              enableWorker: true,
              lowLatencyMode: true,
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            player.hls = hls;

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.warn('Fatal network error in HLS, recovering...');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.warn('Fatal media error in HLS, recovering...');
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error('Fatal unrecoverable HLS stream error:', data);
                    hls.destroy();
                    setPlayerError('Stream buffer failure. Switch to fallback server.');
                    if (onStreamError) onStreamError();
                    break;
                }
              }
            });

            player.on('destroy', () => hls.destroy());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          } else {
            player.notice.show = 'HLS streaming not natively supported in this browser';
          }
        },
      },
      theme: '#e50914',
      autoplay: true,
      autoSize: false,
      autoMini: false,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      hotkey: true,
      subtitle: defaultSub?.url
        ? {
            url: defaultSub.url,
            type: 'vtt',
            style: {
              color: '#ffffff',
              fontSize: '24px',
              textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
              fontWeight: '600',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
            encoding: 'utf-8',
          }
        : undefined,
      controls: [
        {
          name: 'theater',
          position: 'right',
          html: '<span class="art-icon" style="display:flex;align-items:center;cursor:pointer;font-size:12px;font-weight:bold;color:#e4e4e7;">📺 Theater</span>',
          tooltip: 'Toggle Cinema Theater View [T]',
          click: () => {
            if (onToggleTheater) onToggleTheater();
          },
        },
      ],
    });

    artRef.current = art;

    // Time update for progress saving
    let lastSavedTime = 0;
    art.on('video:timeupdate', () => {
      const now = Math.floor(art.currentTime);
      if (now - lastSavedTime >= 5) {
        lastSavedTime = now;
        saveProgress({
          id: Number(tmdbId),
          type,
          title,
          poster_path: null,
          backdrop_path: backdropPath || null,
          vote_average: 0,
          season: type === 'tv' ? season : undefined,
          episode: type === 'tv' ? episode : undefined,
        });
      }
    });

    art.on('video:error', (e) => {
      console.error('ArtPlayer playback error event:', e);
      setPlayerError('Stream error encountered. Switching to backup server...');
      if (onStreamError) onStreamError();
    });

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [streamUrl, subtitles, tmdbId, type, season, episode, title, backdropPath, onToggleTheater, onStreamError, saveProgress]);

  // Handle Subtitle Language Change
  const handleSubtitleChange = (lang: string) => {
    setSelectedSubLanguage(lang);
    if (!artRef.current) return;

    if (lang === 'none') {
      artRef.current.subtitle.show = false;
    } else {
      const track = subtitles.find((s) => s.language === lang);
      if (track?.url) {
        artRef.current.subtitle.init({
          url: track.url,
          type: 'vtt',
          style: {
            color: '#ffffff',
            fontSize: `${subFontSize}px`,
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
            fontWeight: '600',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        });
        artRef.current.subtitle.show = true;
      }
    }
  };

  // Handle Subtitle Offset / Delay Sync
  const handleOffsetChange = (newOffset: number) => {
    const clamped = Math.round(newOffset * 10) / 10;
    setSubtitleOffset(clamped);
    if (artRef.current && artRef.current.subtitle) {
      (artRef.current.subtitle as any).offset = clamped;
      artRef.current.notice.show = `Subtitle Sync: ${clamped > 0 ? `+${clamped}` : clamped}s`;
    }
  };

  // Handle Subtitle Font Size Change
  const handleFontSizeChange = (size: number) => {
    setSubFontSize(size);
    if (artRef.current && artRef.current.subtitle) {
      artRef.current.subtitle.style({
        fontSize: `${size}px`,
      });
    }
  };

  // Handle Local Custom Subtitle File Upload
  const handleCustomSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artRef.current) return;

    const fileUrl = URL.createObjectURL(file);
    const fileType = file.name.endsWith('.srt') ? 'srt' : 'vtt';

    artRef.current.subtitle.init({
      url: fileUrl,
      type: fileType,
      style: {
        color: '#ffffff',
        fontSize: `${subFontSize}px`,
        textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    });
    artRef.current.subtitle.show = true;
    setSelectedSubLanguage('custom');
    artRef.current.notice.show = `Loaded custom subtitle: ${file.name}`;
  };

  // Keyboard Shortcuts (T for Theater, C for Captions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key.toLowerCase() === 't' && onToggleTheater) {
        e.preventDefault();
        onToggleTheater();
      } else if (e.key.toLowerCase() === 'c' && artRef.current) {
        e.preventDefault();
        artRef.current.subtitle.show = !artRef.current.subtitle.show;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleTheater]);

  return (
    <div className="relative w-full flex flex-col group">
      {/* Ambient Halo Glow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-red-600/25 via-rose-600/15 to-purple-600/20 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10" />

      {/* Main ArtPlayer Container */}
      <div
        className={cn(
          'relative w-full bg-black overflow-hidden shadow-2xl shadow-black transition-all duration-300',
          isTheaterMode
            ? 'aspect-[21/9] min-h-[480px] max-h-[78vh] rounded-2xl border border-red-500/30 shadow-red-950/25'
            : 'aspect-video rounded-2xl border border-zinc-800/90 hover:border-zinc-700'
        )}
      >
        <div ref={containerRef} className="w-full h-full" />

        {/* Error overlay banner */}
        {playerError && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500 animate-pulse" />
            <p className="text-sm font-bold text-white">{playerError}</p>
            {onStreamError && (
              <button
                onClick={onStreamError}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                Switch to Fallback Embed Server
              </button>
            )}
          </div>
        )}
      </div>

      {/* Under-Player Toolbar: Subtitle Suite & Server Diagnostics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ArtPlayer Native HLS Stream</span>
          </div>

          <span className="text-zinc-600">•</span>

          {/* Subtitle Suite Trigger */}
          <button
            onClick={() => setIsSubtitlePanelOpen(!isSubtitlePanelOpen)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm',
              isSubtitlePanelOpen
                ? 'bg-red-600/20 text-red-400 border-red-500/40'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            )}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Subtitles Suite</span>
            {selectedSubLanguage !== 'none' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/40 text-red-300 uppercase font-bold">
                {selectedSubLanguage}
              </span>
            )}
          </button>
        </div>

        {/* Quick Theater / Reload Actions */}
        <div className="flex items-center gap-3">
          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <Tv className="w-3 h-3 text-zinc-400" />
              <span>{isTheaterMode ? 'Exit Theater' : 'Theater [T]'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (artRef.current) {
                artRef.current.url = streamUrl;
                artRef.current.notice.show = 'Reloading Stream...';
              }
            }}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-zinc-400" />
            <span>Reload Stream</span>
          </button>
        </div>
      </div>

      {/* Expandable Subtitle Control Suite Drawer */}
      {isSubtitlePanelOpen && (
        <div className="mt-3 p-4 rounded-2xl bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-500" />
              <span>Subtitle & Closed Caption Suite</span>
            </h4>
            <span className="text-[11px] text-zinc-500">Shortcut: Press [C] to toggle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Language Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-zinc-300">
                Language Track ({subtitles.length} Available)
              </label>
              <select
                value={selectedSubLanguage}
                onChange={(e) => handleSubtitleChange(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-white text-xs rounded-xl p-2 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="none">Off (No Subtitles)</option>
                {subtitles.map((sub, idx) => (
                  <option key={`${sub.language}-${idx}`} value={sub.language}>
                    {sub.label} ({sub.language.toUpperCase()})
                  </option>
                ))}
                {selectedSubLanguage === 'custom' && <option value="custom">Custom File (Active)</option>}
              </select>
            </div>

            {/* 2. Subtitle Timing Sync (+/- Offset) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-500" />
                  <span>Sync Timing Offset</span>
                </span>
                <span className="text-red-400 font-bold">
                  {subtitleOffset > 0 ? `+${subtitleOffset}` : subtitleOffset}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOffsetChange(subtitleOffset - 0.5)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  -0.5s
                </button>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={subtitleOffset}
                  onChange={(e) => handleOffsetChange(parseFloat(e.target.value))}
                  className="flex-1 accent-red-600 cursor-pointer"
                />
                <button
                  onClick={() => handleOffsetChange(subtitleOffset + 0.5)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  +0.5s
                </button>
                {subtitleOffset !== 0 && (
                  <button
                    onClick={() => handleOffsetChange(0)}
                    className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* 3. Subtitle Size & Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-zinc-300">
                Font Sizing & Custom Upload
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={subFontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="bg-zinc-950 border border-zinc-800 text-white text-xs rounded-xl p-2 focus:outline-none focus:border-red-500 cursor-pointer flex-1"
                >
                  <option value={18}>Small (18px)</option>
                  <option value={24}>Standard (24px)</option>
                  <option value={30}>Large (30px)</option>
                  <option value={36}>Extra Large (36px)</option>
                </select>

                <label
                  title="Upload .srt or .vtt subtitle file from device"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold cursor-pointer transition-colors shadow-md"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".srt,.vtt"
                    onChange={handleCustomSubtitleUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
