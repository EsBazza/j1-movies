'use client';

import React from 'react';
import Image from 'next/image';
import { getBackdropUrl } from '@/lib/tmdb';
import { ExtractedPalette } from '@/lib/colorExtractor';

interface AmbientBackgroundProps {
  backdropPath?: string | null;
  posterPath?: string | null;
  palette: ExtractedPalette;
}

export function AmbientBackground({
  backdropPath,
  posterPath,
  palette,
}: AmbientBackgroundProps) {
  const imageSource = backdropPath || posterPath;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic High-Diffusion Multi-Color Backdrop Image */}
      {imageSource && (
        <div className="absolute -inset-[15%] pointer-events-none overflow-hidden">
          <Image
            src={getBackdropUrl(imageSource, 'w1280')}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-135 filter blur-[80px] saturate-[280%] brightness-80 opacity-80 transition-all duration-1000"
          />
        </div>
      )}

      {/* Spot 1: Vibrant Primary Color Bloom (Top Left) */}
      <div
        className="absolute -top-[10%] -left-[15%] w-[85vw] h-[900px] rounded-full filter blur-[90px] opacity-95 transition-all duration-1000 mix-blend-screen"
        style={{ backgroundColor: palette.primaryGlow }}
      />

      {/* Spot 2: Vibrant Secondary Color Bloom (Top Right) */}
      <div
        className="absolute top-[5%] -right-[15%] w-[85vw] h-[900px] rounded-full filter blur-[90px] opacity-90 transition-all duration-1000 mix-blend-screen"
        style={{ backgroundColor: palette.secondaryGlow }}
      />

      {/* Spot 3: Chromatic Tertiary Color Bloom (Mid Body) */}
      <div
        className="absolute top-[35%] -left-[20%] w-[90vw] h-[950px] rounded-full filter blur-[100px] opacity-85 transition-all duration-1000 mix-blend-screen"
        style={{ backgroundColor: palette.tertiaryGlow }}
      />

      {/* Spot 4: Atmospheric Quaternary Color Bloom (Lower Body) */}
      <div
        className="absolute top-[60%] -right-[20%] w-[95vw] h-[1000px] rounded-full filter blur-[110px] opacity-85 transition-all duration-1000 mix-blend-screen"
        style={{ backgroundColor: palette.quaternaryGlow }}
      />

      {/* Spot 5: Central Chromatic Mixing Orb */}
      <div
        className="absolute top-[20%] left-[20%] w-[60vw] h-[600px] rounded-full filter blur-[90px] opacity-80 transition-all duration-1000 mix-blend-screen"
        style={{ backgroundColor: palette.primaryGlow }}
      />

      {/* Multi-Point Chromatic Radial Mesh Lighting */}
      <div
        className="absolute inset-0 opacity-75 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 15% 20%, ${palette.primaryGlow}, transparent 60%), radial-gradient(ellipse 90% 70% at 85% 30%, ${palette.secondaryGlow}, transparent 60%), radial-gradient(ellipse 90% 70% at 20% 65%, ${palette.tertiaryGlow}, transparent 60%), radial-gradient(ellipse 100% 70% at 80% 85%, ${palette.quaternaryGlow}, transparent 60%)`,
        }}
      />

      {/* Soft atmospheric overlay */}
      <div className="absolute inset-0 bg-[#07090e]/30" />
    </div>
  );
}
