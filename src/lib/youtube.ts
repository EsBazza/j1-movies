'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** Builds a muted, chrome-less background embed URL that supports postMessage commands. */
export function getBackgroundTrailerUrl(key: string, loop = true): string {
  const loopParams = loop ? `&loop=1&playlist=${key}` : '';
  return `${YT_ORIGIN}/embed/${key}?autoplay=1&mute=1${loopParams}&controls=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&disablekb=1&fs=0`;
}

/** Sends a YouTube IFrame API command (mute, unMute, setVolume, playVideo, pauseVideo…). */
export function ytCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);
}

/** Applies a volume level (0 = muted) to a background trailer. */
export function ytSetVolume(iframe: HTMLIFrameElement | null, volume: number) {
  if (volume <= 0) {
    ytCommand(iframe, 'mute');
  } else {
    ytCommand(iframe, 'unMute');
    ytCommand(iframe, 'setVolume', [volume]);
  }
}

function subscribeNoop() {
  return () => {};
}

function getAutoplaySnapshot(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}

/**
 * Whether background trailers and hero rotation should autoplay: false only on
 * data-saver connections (and during SSR). Users can always pause via the hero controls.
 */
export function useAutoplayAllowed(): boolean {
  return useSyncExternalStore(subscribeNoop, getAutoplaySnapshot, () => false);
}

// ── Shared mute preference for every background trailer ────────────────────
const MUTE_KEY = 'j1-trailer-muted';
let muted = true;
let mutedLoaded = false;
const muteListeners = new Set<() => void>();

function readMuted(): boolean {
  if (!mutedLoaded) {
    mutedLoaded = true;
    try {
      muted = window.localStorage.getItem(MUTE_KEY) !== 'false';
    } catch {
      // storage unavailable — stay muted
    }
  }
  return muted;
}

export function setTrailerMuted(value: boolean) {
  muted = value;
  mutedLoaded = true;
  try {
    window.localStorage.setItem(MUTE_KEY, String(value));
  } catch {
    // ignore
  }
  muteListeners.forEach((l) => l());
}

export function useTrailerMuted(): boolean {
  return useSyncExternalStore(
    (l) => {
      muteListeners.add(l);
      return () => muteListeners.delete(l);
    },
    readMuted,
    () => true
  );
}

const YT_PLAYING = 1;
const YT_ENDED = 0;
const TRAILER_VOLUME = 80;

interface BackgroundTrailerOptions {
  videoKey: string | null;
  enabled?: boolean;
  /** Loop the trailer (details page) or let it end (hero advances on end) */
  loop?: boolean;
  onEnded?: () => void;
}

/**
 * Muted background trailer driven by the YouTube IFrame API over postMessage:
 * - `isPlaying` only turns true once YouTube reports PLAYING, so the backdrop
 *   cross-fades without black frames;
 * - pauses when scrolled out of view, when the tab is hidden, or by the user;
 * - mute preference is shared and remembered.
 */
export function useBackgroundTrailer({ videoKey, enabled = true, loop = true, onEnded }: BackgroundTrailerOptions) {
  // Element kept in state (via a callback ref) so effects re-run when the iframe mounts
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const isMuted = useTrailerMuted();
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  const active = enabled && Boolean(videoKey);
  const shouldPlay = !userPaused && inView && !tabHidden;

  useEffect(() => {
    if (!active) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== iframe?.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const state =
        data?.event === 'onStateChange'
          ? data.info
          : data?.event === 'infoDelivery'
          ? (data.info as { playerState?: number } | undefined)?.playerState
          : undefined;
      if (state === YT_PLAYING) setPlayingKey(videoKey);
      else if (state === YT_ENDED) {
        setPlayingKey(null);
        onEndedRef.current?.();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [active, videoKey, iframe]);

  useEffect(() => {
    if (!container) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(container);
    return () => io.disconnect();
  }, [container]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    ytCommand(iframe, shouldPlay ? 'playVideo' : 'pauseVideo');
  }, [shouldPlay, iframe]);

  useEffect(() => {
    ytSetVolume(iframe, isMuted ? 0 : TRAILER_VOLUME);
  }, [isMuted, iframe]);

  const onLoad = useCallback(() => {
    // Subscribe to player events, then re-apply the current mute/pause state
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoKey, channel: 'widget' }), YT_ORIGIN);
    ytCommand(iframe, 'addEventListener', ['onStateChange']);
    if (!readMuted()) ytSetVolume(iframe, TRAILER_VOLUME);
  }, [videoKey, iframe]);

  return {
    /** Callback ref for the element whose visibility should pause the trailer */
    observeContainer: setContainer,
    /** Callback ref for the trailer <iframe> */
    attachIframe: setIframe,
    iframeProps:
      active && videoKey
        ? {
            src: getBackgroundTrailerUrl(videoKey, loop),
            onLoad,
            title: 'Background trailer',
            tabIndex: -1,
            allow: 'autoplay; encrypted-media',
            'aria-hidden': true as const,
          }
        : null,
    isPlaying: active && playingKey === videoKey && shouldPlay,
    isMuted,
    toggleMute: () => setTrailerMuted(!isMuted),
    isPaused: userPaused,
    togglePause: () => {
      setUserPaused((p) => !p);
    },
  };
}
