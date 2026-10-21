'use client';

import { useEffect } from 'react';
import { ExtractedPalette } from '@/lib/colorExtractor';
import { setActivePalette } from '@/lib/palette';

interface AmbientBackgroundProps {
  palette: ExtractedPalette;
  /** Kept for call-site compatibility; the background is now gradient-only. */
  backdropPath?: string | null;
  posterPath?: string | null;
}

/**
 * Publishes a page's palette to the global ambient layer (rendered once in the root
 * layout). Renders nothing itself.
 */
export function AmbientBackground({ palette }: AmbientBackgroundProps) {
  useEffect(() => {
    setActivePalette(palette);
  }, [palette]);
  return null;
}

/** Fixed, GPU-cheap backdrop: radial gradients driven by the palette CSS variables. */
export function AmbientLayer() {
  return <div aria-hidden="true" className="ambient-layer" />;
}
