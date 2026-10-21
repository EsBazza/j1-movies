'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/**
 * Muted, chrome-less background embed URL that supports postMessage commands.
 * No `playlist=` loop param: that turns the embed into a playlist and YouTube then
 * draws previous/next controls over the video. Looping is done by the hook instead.
 */
export function getBackgroundTrailerUrl(key: string): string {
  return `${YT_ORIGIN}/embed/${key}?autoplay=1&mute=1&controls=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&disablekb=1&fs=0`;
}

/**
 * YouTube shows its own play/pause cluster for a few seconds whenever playback starts.
 * Background trailers hide it with a slow focus-pull (TRAILER_FADE.in); the small hover
 * preview simply waits this long before revealing.
 */
export const TRAILER_REVEAL_DELAY_MS = 4500;

/** Trailer layer fade: gentle reveal, fast hide (the backdrop underneath stays opaque). */
// One consistent reveal for first plays and resumes: a 4.5s focus pull (blurred and
// faint first, sharpening mostly at the end) so YouTube's start controls stay hidden
const TRAILER_REVEAL = 'opacity-100 blur-[0px] duration-[4500ms] delay-0 ease-[cubic-bezier(0.65,0,0.85,0.35)]';

export const TRAILER_FADE = {
  base: 'transition-[opacity,filter] will-change-[opacity,filter]',
  // First play: 4.5s focus pull (blurred and faint first, sharpening mostly at the end),
  // long enough for YouTube's start-of-playback controls to fade on their own
  in: 'opacity-100 blur-[0px] duration-[4500ms] delay-0 ease-[cubic-bezier(0.65,0,0.85,0.35)]',
  // After the user's own pause, or a loop restart: YouTube only flashes a play icon
  // (~1s), so a short pull covers it. Scrolling away never pauses, so it never fades.
  resume: 'opacity-100 blur-[0px] duration-[1200ms] delay-0 ease-[cubic-bezier(0.65,0,0.85,0.35)]',
  // Hide fast; on a user pause this runs before the player is told to pause
  out: 'opacity-0 blur-[28px] duration-150 delay-0 ease-out',
};

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
  return useSyncExternalStore(subscribeAudio, readMuted, () => true);
}

// ── Shared volume level (0-100), remembered alongside mute ─────────────────
const VOLUME_KEY = 'j1-trailer-volume';
const DEFAULT_VOLUME = 80;
let volume = DEFAULT_VOLUME;
let volumeLoaded = false;

function readVolume(): number {
  if (!volumeLoaded) {
    volumeLoaded = true;
    try {
      const stored = Number(window.localStorage.getItem(VOLUME_KEY));
      if (Number.isFinite(stored) && stored > 0 && stored <= 100) volume = stored;
    } catch {
      // storage unavailable — keep default
    }
  }
  return volume;
}

/** Sets the trailer volume; 0 mutes, anything above unmutes. */
export function setTrailerVolume(value: number) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  if (v === 0) {
    setTrailerMuted(true);
    return;
  }
  volume = v;
  volumeLoaded = true;
  try {
    window.localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    // ignore
  }
  setTrailerMuted(false);
}

export function useTrailerVolume(): number {
  return useSyncExternalStore(subscribeAudio, readVolume, () => DEFAULT_VOLUME);
}

function subscribeAudio(l: () => void) {
  muteListeners.add(l);
  return () => muteListeners.delete(l);
}

const YT_PLAYING = 1;
const YT_ENDED = 0;
const YT_PAUSED = 2;

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
  // Whether the current trailer has already played once (later plays are resumes)
  const [resumed, setResumed] = useState(false);
  const startedKeyRef = useRef<string | null>(null);
  // A new <iframe> element is a fresh YouTube start (full controls), not a resume
  useEffect(() => {
    startedKeyRef.current = null;
  }, [iframe]);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const isMuted = useTrailerMuted();
  const level = useTrailerVolume();
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  const active = enabled && Boolean(videoKey);
  // Off-screen / background tab: keep playing but silent. Pausing would make YouTube
  // draw its play/pause overlay again on resume; a muted, still-playing trailer never does.
  const audible = inView && !tabHidden;
  // Pause only on an explicit user pause — after the trailer has faded out
  const PAUSE_AFTER_FADE_MS = 180;
  const audibleRef = useRef(audible);
  useEffect(() => {
    audibleRef.current = audible;
  });

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
      if (state === YT_PLAYING) {
        // Reveal only after YouTube's start-of-playback overlay has faded
        // Reveal right away: the slow focus-pull (TRAILER_FADE.in) keeps YouTube's
        // start-of-playback controls blurred until they've faded on their own;
        // later plays of the same trailer use the short TRAILER_FADE.resume
        setResumed(startedKeyRef.current === videoKey);
        startedKeyRef.current = videoKey;
        setPlayingKey(videoKey);
      } else if (state === YT_PAUSED || state === YT_ENDED) {
        setPlayingKey(null);
        if (state === YT_ENDED) {
          if (loop) {
            ytCommand(iframe, 'seekTo', [0, true]);
            ytCommand(iframe, 'playVideo');
          } else {
            onEndedRef.current?.();
          }
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [active, videoKey, iframe, loop]);

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
    if (!userPaused) {
      ytCommand(iframe, 'playVideo');
      return;
    }
    const t = setTimeout(() => ytCommand(iframe, 'pauseVideo'), PAUSE_AFTER_FADE_MS);
    return () => clearTimeout(t);
  }, [userPaused, iframe]);

  useEffect(() => {
    ytSetVolume(iframe, isMuted || !audible ? 0 : level);
  }, [isMuted, level, audible, iframe]);

  const onLoad = useCallback(() => {
    // Subscribe to player events, then re-apply the current mute/pause state
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoKey, channel: 'widget' }), YT_ORIGIN);
    ytCommand(iframe, 'addEventListener', ['onStateChange']);
    if (!readMuted() && audibleRef.current) ytSetVolume(iframe, readVolume());
  }, [videoKey, iframe]);

  return {
    /** Callback ref for the element whose visibility should pause the trailer */
    observeContainer: setContainer,
    /** Callback ref for the trailer <iframe> */
    attachIframe: setIframe,
    iframeProps:
      active && videoKey
        ? {
            src: getBackgroundTrailerUrl(videoKey),
            onLoad,
            title: 'Background trailer',
            tabIndex: -1,
            allow: 'autoplay; encrypted-media',
            'aria-hidden': true as const,
          }
        : null,
    // Hides immediately on a user pause (before the PAUSED event arrives)
    isPlaying: active && playingKey === videoKey && !userPaused,
    /** Reveal class for the trailer layer: long focus pull first time, short on resume */
    revealClass: resumed ? TRAILER_FADE.resume : TRAILER_FADE.in,
    isMuted,
    toggleMute: () => setTrailerMuted(!isMuted),
    isPaused: userPaused,
    togglePause: () => {
      setUserPaused((p) => !p);
    },
  };
}
