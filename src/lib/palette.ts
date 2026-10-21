'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { DEFAULT_PALETTE, ExtractedPalette, extractPaletteFromImage } from '@/lib/colorExtractor';

/**
 * Global, title-driven colour palette. The active hero slide or details page sets it;
 * it is written to CSS custom properties on <html> so every `bg-accent` / ambient
 * gradient follows the current title without React re-renders.
 */

type RGB = [number, number, number];

function parseRgb(color: string): RGB | null {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function relativeLuminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Lifts very dark colours so the accent stays visible on the near-black background. */
function ensureVisibleOnDark(rgb: RGB): RGB {
  let out = rgb;
  for (let i = 0; i < 6 && relativeLuminance(out) < 0.06; i++) {
    out = out.map((c) => Math.min(255, Math.round(c + (255 - c) * 0.18))) as RGB;
  }
  return out;
}

const FALLBACK_ACCENT: RGB = [229, 9, 20];

export function paletteToCssVars(palette: ExtractedPalette): Record<string, string> {
  const accent = ensureVisibleOnDark(parseRgb(palette.primary) ?? FALLBACK_ACCENT);
  const lum = relativeLuminance(accent);
  // Pick black or white text — whichever has the higher contrast on the accent
  const onAccent = contrast(lum, 1) >= contrast(lum, 0) ? '#ffffff' : '#0a0a0b';
  const glow = (c: string, fallback: string) => {
    const rgb = parseRgb(c);
    return rgb ? `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})` : fallback;
  };
  // Registered as <color> via @property in globals.css, so changes cross-fade
  return {
    '--dyn-accent': `rgb(${accent[0]} ${accent[1]} ${accent[2]})`,
    '--on-accent': onAccent,
    '--dyn-glow-1': glow(palette.primary, '#e50914'),
    '--dyn-glow-2': glow(palette.secondary, '#3b82f6'),
    '--dyn-glow-3': glow(palette.tertiary, '#a855f7'),
    '--dyn-glow-4': glow(palette.quaternary, '#f59e0b'),
  };
}

let current: ExtractedPalette = DEFAULT_PALETTE;
const listeners = new Set<() => void>();

export function setActivePalette(palette: ExtractedPalette) {
  if (palette === current) return;
  current = palette;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(paletteToCssVars(palette))) {
      root.style.setProperty(key, value);
    }
  }
  listeners.forEach((l) => l());
}

/** Read the active palette (for the few places that need raw colours, e.g. inline SVG). */
export function useActivePalette(): ExtractedPalette {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => DEFAULT_PALETTE
  );
}

// ── Trailer-driven colours ──────────────────────────────────────────────────
// The YouTube player itself can't be read (cross-origin), but YouTube serves CORS-enabled
// still frames: hqdefault plus 1/2/3 (≈25/50/75% through the video).
const TRAILER_FRAMES = ['hqdefault', '1', '2', '3'];
const FRAME_INTERVAL_MS = 7000;
const framePaletteCache = new Map<string, ExtractedPalette[]>();

/**
 * While a background trailer is visibly playing, cycles the global palette through the
 * trailer's frames (colours cross-fade via the registered CSS properties). When it
 * stops, the title's base palette comes back.
 */
export function useTrailerPalette(trailerKey: string | null, isPlaying: boolean, basePalette?: ExtractedPalette) {
  const [frames, setFrames] = useState<{ key: string; palettes: ExtractedPalette[] } | null>(null);

  useEffect(() => {
    if (!trailerKey) return;
    const cached = framePaletteCache.get(trailerKey);
    if (cached) {
      setFrames({ key: trailerKey, palettes: cached });
      return;
    }
    let ignore = false;
    Promise.all(
      TRAILER_FRAMES.map((f) => extractPaletteFromImage(`https://i.ytimg.com/vi/${trailerKey}/${f}.jpg`))
    ).then((palettes) => {
      // extractPaletteFromImage falls back to the default palette on failure; drop those
      const usable = palettes.filter((p) => p !== DEFAULT_PALETTE);
      framePaletteCache.set(trailerKey, usable);
      if (!ignore) setFrames({ key: trailerKey, palettes: usable });
    });
    return () => {
      ignore = true;
    };
  }, [trailerKey]);

  const palettes = frames && frames.key === trailerKey ? frames.palettes : null;

  useEffect(() => {
    if (!isPlaying || !palettes?.length) {
      if (basePalette) setActivePalette(basePalette);
      return;
    }
    let i = 0;
    setActivePalette(palettes[0]);
    if (palettes.length < 2) return;
    const timer = setInterval(() => {
      i = (i + 1) % palettes.length;
      setActivePalette(palettes[i]);
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, palettes, basePalette]);
}
