'use client';

import React, { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Shuffle, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Chip } from '@/components/ui/Chip';
import { Button, LinkButton } from '@/components/ui/Button';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { discoverMedia, getBackdropUrl, normalizeMediaItem } from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { formatYear } from '@/lib/utils';

type Kind = 'any' | 'movie' | 'tv';

const GENRES: { id: number; name: string; movieOnly?: boolean }[] = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror', movieOnly: true },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller', movieOnly: true },
  { id: 10749, name: 'Romance', movieOnly: true },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 9648, name: 'Mystery' },
  { id: 14, name: 'Fantasy' },
  { id: 99, name: 'Documentary' },
];

const RATINGS = [0, 6.5, 7.5];
const MAX_PAGE = 15;
const RECENT_LIMIT = 20;

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

interface SurpriseMeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SurpriseMe({ isOpen, onClose }: SurpriseMeProps) {
  const [kind, setKind] = useState<Kind>('any');
  const [genre, setGenre] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [result, setResult] = useState<NormalizedMedia | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const recentRef = useRef<string[]>([]);
  // Remembers how many pages each filter combination has, so we only pick real pages
  const pageCountRef = useRef(new Map<string, number>());

  const roll = useCallback(async () => {
    setStatus('loading');
    const genreDef = GENRES.find((g) => g.id === genre);
    const mediaType: 'movie' | 'tv' = genreDef?.movieOnly || kind === 'movie' ? 'movie' : kind === 'tv' ? 'tv' : pick(['movie', 'tv'] as const);
    const filters = {
      mediaType,
      genreId: genre ?? undefined,
      minRating: minRating || undefined,
      minVotes: 150,
      sortBy: 'popularity.desc',
    };
    const key = JSON.stringify(filters);

    try {
      const knownPages = pageCountRef.current.get(key);
      const page = knownPages ? 1 + Math.floor(Math.random() * Math.min(knownPages, MAX_PAGE)) : 1;
      let res = await discoverMedia({ ...filters, page });
      pageCountRef.current.set(key, res.total_pages || 1);

      // First roll for a filter set only knows page 1; jump to a random page once we know the count
      if (!knownPages && (res.total_pages || 1) > 1) {
        const randomPage = 1 + Math.floor(Math.random() * Math.min(res.total_pages, MAX_PAGE));
        if (randomPage !== 1) res = await discoverMedia({ ...filters, page: randomPage });
      }

      const candidates = (res.results || [])
        .filter((r) => r.backdrop_path && r.poster_path)
        .map((r) => normalizeMediaItem(r, mediaType))
        .filter((m) => !recentRef.current.includes(`${m.type}-${m.id}`));

      if (candidates.length === 0) {
        setStatus('empty');
        return;
      }
      const chosen = pick(candidates);
      recentRef.current = [`${chosen.type}-${chosen.id}`, ...recentRef.current].slice(0, RECENT_LIMIT);
      setResult(chosen);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, [kind, genre, minRating]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Surprise me" description="Pick a mood, then shuffle." className="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
          {(['any', 'movie', 'tv'] as const).map((k) => (
            <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
              {k === 'any' ? 'Anything' : k === 'movie' ? 'Movies' : 'Series'}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Genre">
          <Chip selected={genre === null} onClick={() => setGenre(null)}>
            Any genre
          </Chip>
          {GENRES.map((g) => (
            <Chip key={g.id} selected={genre === g.id} onClick={() => setGenre(g.id)}>
              {g.name}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Minimum rating">
          {RATINGS.map((r) => (
            <Chip key={r} selected={minRating === r} onClick={() => setMinRating(r)}>
              {r === 0 ? 'Any rating' : `${r}+`}
            </Chip>
          ))}
        </div>

        <div aria-live="polite" className="min-h-[2rem]">
          {result && (
            <article key={`${result.type}-${result.id}`} className="animate-scale-in rounded-panel overflow-hidden bg-surface-2">
              <div className="relative aspect-video">
                <Image
                  src={getBackdropUrl(result.backdropPath, 'w780')}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-surface-2/20 to-transparent" />
              </div>
              <div className="p-4 -mt-10 relative">
                <h3 className="text-xl font-bold text-white">{result.title}</h3>
                <p className="flex items-center gap-2 text-xs text-muted mt-1">
                  <span>{result.type === 'movie' ? 'Movie' : 'Series'}</span>
                  {result.releaseDate && <span>· {formatYear(result.releaseDate)}</span>}
                  {result.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      · <Star className="w-3 h-3 fill-amber-400" aria-hidden="true" /> {result.rating}
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-300 mt-2 line-clamp-3">{result.overview}</p>
                <div className="flex items-center gap-2 mt-4">
                  <LinkButton href={`/details/${result.type}/${result.id}`} onClick={onClose} size="md">
                    View details
                  </LinkButton>
                  <BookmarkButton
                    item={{
                      id: result.id,
                      type: result.type,
                      title: result.title,
                      poster_path: result.posterPath,
                      backdrop_path: result.backdropPath,
                      vote_average: result.rating,
                      release_date: result.releaseDate,
                    }}
                    className="p-3"
                  />
                </div>
              </div>
            </article>
          )}
          {status === 'empty' && <p className="text-sm text-muted">Nothing matched. Try a different genre or rating.</p>}
          {status === 'error' && <p className="text-sm text-muted">Couldn&apos;t reach TMDB. Try again.</p>}
        </div>

        <Button onClick={roll} disabled={status === 'loading'} size="lg" className="self-start">
          <Shuffle className={status === 'loading' ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} aria-hidden="true" />
          {result ? 'Shuffle again' : 'Shuffle'}
        </Button>
      </div>
    </Modal>
  );
}

// Single instance rendered in the root layout; open it from anywhere with openSurpriseMe().
let open = false;
const listeners = new Set<() => void>();
const setOpen = (value: boolean) => {
  open = value;
  listeners.forEach((l) => l());
};

export function openSurpriseMe() {
  setOpen(true);
}

export function SurpriseMeHost() {
  const isOpen = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false
  );
  return <SurpriseMe isOpen={isOpen} onClose={() => setOpen(false)} />;
}
