'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';
import { formatYear } from '@/lib/utils';
import { useUserStoreSelector } from '@/lib/store';
import { showPreview, hidePreview } from '@/components/media/PreviewPopover';

interface MediaCardProps {
  item: NormalizedMedia;
  priority?: boolean;
  rank?: number;
}

const HOVER_INTENT_MS = 550;

export function MediaCard({ item, priority = false, rank }: MediaCardProps) {
  const [posterError, setPosterError] = useState(false);
  const posterRef = useRef<HTMLAnchorElement>(null);
  const intentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Selector keeps cards from re-rendering on unrelated store writes
  const progress = useUserStoreSelector(
    (s) => s.history.find((h) => h.id === item.id && h.type === item.type && !h.finished)?.progressPercent
  );

  useEffect(() => {
    return () => {
      if (intentTimer.current) clearTimeout(intentTimer.current);
    };
  }, []);

  const detailsUrl = `/details/${item.type}/${item.id}`;
  const imageUrl = posterError ? getBackdropUrl(item.backdropPath, 'w780') : getPosterUrl(item.posterPath, 'w342');

  // Hover preview: mouse + hover-capable devices only; touch just opens details
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !window.matchMedia('(hover: hover)').matches) return;
    intentTimer.current = setTimeout(() => {
      const rect = posterRef.current?.getBoundingClientRect();
      if (rect) showPreview(item, rect);
    }, HOVER_INTENT_MS);
  };
  const onPointerLeave = () => {
    if (intentTimer.current) clearTimeout(intentTimer.current);
    hidePreview();
  };

  return (
    <div className="group/card flex flex-col w-full" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <Link
        ref={posterRef}
        href={detailsUrl}
        className="relative block aspect-[2/3] w-full rounded-card overflow-hidden bg-surface-2 transition-transform duration-300 ease-out-expo group-hover/card:scale-[1.03] will-change-transform"
        aria-label={rank ? `Number ${rank}: ${item.title}` : item.title}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 200px"
          onError={() => setPosterError(true)}
          className="object-cover"
        />
        {item.rating > 0 && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/65 text-[11px] font-semibold text-white">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="sr-only">Rated </span>
            {item.rating.toFixed(1)}
          </span>
        )}
        {progress ? (
          <span
            className="absolute bottom-0 inset-x-0 h-1 bg-black/60"
            role="progressbar"
            aria-label="Watch progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="block h-full bg-accent" style={{ width: `${Math.max(3, progress)}%` }} />
          </span>
        ) : null}
      </Link>

      <div className="pt-3 min-w-0" aria-hidden="true">
        <p className="text-[13px] font-medium text-zinc-200 truncate group-hover/card:text-white transition-colors">
          {item.title}
        </p>
        <p className="text-xs text-subtle mt-0.5">
          {item.releaseDate ? formatYear(item.releaseDate) : ''}
          {item.releaseDate ? ' · ' : ''}
          {item.type === 'movie' ? 'Movie' : 'Series'}
        </p>
      </div>
    </div>
  );
}
