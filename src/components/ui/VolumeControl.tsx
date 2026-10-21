'use client';

import React from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { setTrailerMuted, setTrailerVolume, useTrailerMuted, useTrailerVolume } from '@/lib/youtube';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  className?: string;
  /** Larger target for hero/details; compact for overlay bars */
  size?: 'md' | 'lg';
}

/**
 * Trailer volume: speaker button toggles mute, slider sets the level (shared and
 * remembered). On hover devices the slider slides out on hover/focus; on touch
 * devices it is always visible.
 */
export function VolumeControl({ className, size = 'lg' }: VolumeControlProps) {
  const isMuted = useTrailerMuted();
  const volume = useTrailerVolume();
  const shown = isMuted ? 0 : volume;
  const Icon = shown === 0 ? VolumeX : shown < 50 ? Volume1 : Volume2;

  return (
    <div
      className={cn(
        'group/vol inline-flex items-center rounded-full bg-white/12 backdrop-blur-md transition-colors hover:bg-white/20',
        size === 'lg' ? 'h-12' : 'h-10',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTrailerMuted(!isMuted)}
        aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
        aria-pressed={!isMuted}
        className={cn('inline-flex items-center justify-center rounded-full text-white flex-shrink-0', size === 'lg' ? 'w-12 h-12' : 'w-10 h-10')}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </button>
      <span
        className={cn(
          'flex items-center overflow-hidden transition-[max-width,opacity,padding] duration-300 ease-out-expo',
          'max-w-0 opacity-0 group-hover/vol:max-w-32 group-hover/vol:opacity-100 group-hover/vol:pr-4',
          'group-focus-within/vol:max-w-32 group-focus-within/vol:opacity-100 group-focus-within/vol:pr-4',
          '[@media(hover:none)]:max-w-28 [@media(hover:none)]:opacity-100 [@media(hover:none)]:pr-4'
        )}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={shown}
          onChange={(e) => setTrailerVolume(Number(e.target.value))}
          aria-label="Trailer volume"
          aria-valuetext={shown === 0 ? 'Muted' : `${shown}%`}
          className="w-24 h-1.5 cursor-pointer accent-[var(--dyn-accent)]"
        />
      </span>
    </div>
  );
}
