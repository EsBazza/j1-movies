'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';

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
