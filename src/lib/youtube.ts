'use client';

import { useSyncExternalStore } from 'react';

export const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** Builds a muted, chrome-less background embed URL that supports postMessage commands. */
export function getBackgroundTrailerUrl(key: string): string {
  return `${YT_ORIGIN}/embed/${key}?autoplay=1&mute=1&loop=1&playlist=${key}&controls=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&disablekb=1&fs=0`;
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
