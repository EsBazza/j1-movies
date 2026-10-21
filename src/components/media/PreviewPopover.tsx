'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { getBackdropUrl, getTrailerKey } from '@/lib/tmdb';
import { getBackgroundTrailerUrl } from '@/lib/youtube';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { formatYear } from '@/lib/utils';

/**
 * Desktop-only hover preview. Cards call showPreview/hidePreview; a single host in the
 * root layout renders the expanded card (backdrop → muted trailer, info, actions).
 */

interface PreviewState {
  item: NormalizedMedia;
  rect: DOMRect;
}

let state: PreviewState | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showPreview(item: NormalizedMedia, rect: DOMRect) {
  if (hideTimer) clearTimeout(hideTimer);
  state = { item, rect };
  emit();
}

/** Hides after a short grace period so the pointer can travel from card to popover. */
export function hidePreview(immediate = false) {
  if (hideTimer) clearTimeout(hideTimer);
  if (immediate) {
    state = null;
    emit();
    return;
  }
  hideTimer = setTimeout(() => {
    state = null;
    emit();
  }, 120);
}

function keepPreview() {
  if (hideTimer) clearTimeout(hideTimer);
}

const WIDTH = 340;
const TRAILER_DELAY_MS = 700;

function PreviewCard({ item, rect }: PreviewState) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerReady, setTrailerReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      getTrailerKey(item.type, item.id).then((key) => !ignore && setTrailerKey(key));
    }, TRAILER_DELAY_MS);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [item.type, item.id]);

  // Centre on the card, clamped to the viewport
  const width = Math.max(WIDTH, rect.width * 1.5);
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - width / 2 + window.scrollX),
    window.scrollX + document.documentElement.clientWidth - width - 12
  );
  const top = Math.max(window.scrollY + 72, rect.top + window.scrollY - 24);
  const originX = ((rect.left + rect.width / 2 + window.scrollX - left) / width) * 100;

  const href = `/details/${item.type}/${item.id}`;

  return (
    <div
      ref={cardRef}
      role="group"
      aria-label={`${item.title} preview`}
      onPointerEnter={keepPreview}
      onPointerLeave={() => hidePreview()}
      style={{ left, top, width, transformOrigin: `${originX}% 20%` }}
      className="absolute z-[var(--z-overlay)] rounded-panel overflow-hidden bg-surface-2 shadow-[0_24px_60px_rgba(0,0,0,0.65)] animate-scale-in"
    >
      <Link href={href} onClick={() => hidePreview(true)} className="relative block aspect-video bg-black" tabIndex={-1}>
        <Image
          src={getBackdropUrl(item.backdropPath || item.posterPath, 'w780')}
          alt=""
          fill
          sizes={`${Math.round(width)}px`}
          className="object-cover"
        />
        {trailerKey && (
          <iframe
            src={getBackgroundTrailerUrl(trailerKey)}
            title={`${item.title} trailer`}
            tabIndex={-1}
            aria-hidden="true"
            allow="autoplay; encrypted-media"
            onLoad={() => setTimeout(() => setTrailerReady(true), 900)}
            className={`absolute inset-0 w-full h-full scale-[1.35] border-0 pointer-events-none transition-opacity duration-700 ${
              trailerReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-2 to-transparent" />
      </Link>

      <div className="px-4 pb-4 -mt-6 relative">
        <h3 className="text-base font-bold text-white line-clamp-1">{item.title}</h3>
        <p className="flex items-center gap-2 text-xs text-muted mt-1">
          {item.rating > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3 h-3 fill-amber-400" aria-hidden="true" />
              {item.rating}
            </span>
          )}
          {item.releaseDate && <span>{formatYear(item.releaseDate)}</span>}
          <span>{item.type === 'movie' ? 'Movie' : 'Series'}</span>
        </p>
        {item.overview && <p className="text-xs text-zinc-300 leading-relaxed mt-2 line-clamp-3">{item.overview}</p>}
        <div className="flex items-center gap-2 mt-3">
          <Link
            href={href}
            onClick={() => hidePreview(true)}
            className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-full bg-accent text-on-accent text-xs font-semibold hover:bg-accent-hover transition-colors"
          >
            View details
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <BookmarkButton
            item={{
              id: item.id,
              type: item.type,
              title: item.title,
              poster_path: item.posterPath,
              backdrop_path: item.backdropPath,
              vote_average: item.rating,
              release_date: item.releaseDate,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function PreviewHost() {
  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => null
  );

  // Any scroll or Escape dismisses the preview
  useEffect(() => {
    if (!current) return;
    const dismiss = () => hidePreview(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    window.addEventListener('scroll', dismiss, { passive: true, capture: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', dismiss, { capture: true });
      window.removeEventListener('keydown', onKey);
    };
  }, [current]);

  if (!current || typeof document === 'undefined') return null;
  return createPortal(<PreviewCard key={`${current.item.type}-${current.item.id}`} {...current} />, document.body);
}
