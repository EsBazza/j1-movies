'use client';

import { useEffect, useRef } from 'react';
import type { StreamingSource } from '@/lib/playerSources';

export interface PlayerProgressEvent {
  currentTime: number;
  duration: number;
}

interface Handlers {
  onProgress: (e: PlayerProgressEvent) => void;
  onEnded?: () => void;
}

type ParsedEvent = { kind: 'progress'; currentTime: number; duration: number } | { kind: 'ended' } | null;

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : NaN;
}

/**
 * Normalizes the postMessage formats of the supported embeds:
 * - VidFast (and similar): { type: 'PLAYER_EVENT', data: { event, currentTime, duration } }
 * - MoviesAPI:        { source: 'moviesapi-player', event|type, currentTime, duration }
 */
function parseMessage(raw: unknown): ParsedEvent {
  let msg = raw;
  if (typeof msg === 'string') {
    try {
      msg = JSON.parse(msg);
    } catch {
      return null;
    }
  }
  if (!msg || typeof msg !== 'object') return null;
  const m = msg as Record<string, unknown>;

  let payload: Record<string, unknown> | null = null;
  if (m.type === 'PLAYER_EVENT' && m.data && typeof m.data === 'object') {
    payload = m.data as Record<string, unknown>;
  } else if (m.source === 'moviesapi-player') {
    payload = (m.data && typeof m.data === 'object' ? m.data : m) as Record<string, unknown>;
  }
  if (!payload) return null;

  const event = String(payload.event ?? m.event ?? m.type ?? '');
  if (event === 'ended' || event === 'complete' || event === 'completed') return { kind: 'ended' };

  const currentTime = toNumber(payload.currentTime ?? payload.time);
  const duration = toNumber(payload.duration);
  if (Number.isNaN(currentTime) || Number.isNaN(duration) || duration <= 0) return null;
  return { kind: 'progress', currentTime, duration };
}

const SAVE_INTERVAL_MS = 5000;

/**
 * Listens for playback events from the active embed (origin-checked) and reports
 * throttled progress plus an "ended" signal.
 */
export function usePlayerProgress(server: StreamingSource, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!server.emitsProgress) return;
    let lastSave = 0;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== server.origin) return;
      const parsed = parseMessage(event.data);
      if (!parsed) return;

      if (parsed.kind === 'ended') {
        handlersRef.current.onEnded?.();
        return;
      }
      const now = Date.now();
      if (now - lastSave < SAVE_INTERVAL_MS) return;
      lastSave = now;
      handlersRef.current.onProgress({ currentTime: parsed.currentTime, duration: parsed.duration });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [server]);
}
