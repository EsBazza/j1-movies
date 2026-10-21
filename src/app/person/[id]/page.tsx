'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { User, ChevronDown } from 'lucide-react';
import { getPersonDetails, getImageUrl, normalizeMediaItem, isNotFoundError } from '@/lib/tmdb';
import { TMDBPersonDetails, NormalizedMedia, MediaType, TMDBMediaItem } from '@/types/tmdb';
import { extractPaletteFromImage, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaCarousel, PAGE_GUTTER } from '@/components/media/MediaCarousel';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Chip } from '@/components/ui/Chip';
import { Button, LinkButton } from '@/components/ui/Button';
import { useReveal } from '@/lib/useReveal';
import { formatDateFull, cn } from '@/lib/utils';

type Filter = 'all' | 'movie' | 'tv' | 'crew';
type Sort = 'popular' | 'rating' | 'newest';

const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10';

function ageOn(birthday: string, until?: string | null): number | null {
  const b = new Date(birthday);
  const end = until ? new Date(until) : new Date();
  if (Number.isNaN(b.getTime()) || Number.isNaN(end.getTime())) return null;
  let age = end.getFullYear() - b.getFullYear();
  const m = end.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < b.getDate())) age--;
  return age;
}

function uniqueMedia(raw: (TMDBMediaItem & { character?: string; job?: string })[]): NormalizedMedia[] {
  const seen = new Set<string>();
  const out: NormalizedMedia[] = [];
  for (const r of raw) {
    const type: MediaType = r.media_type || (r.first_air_date ? 'tv' : 'movie');
    const key = `${type}-${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalizeMediaItem(r, type));
  }
  return out;
}

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className={cn('reveal', className)}>
      {children}
    </section>
  );
}

function PersonContent() {
  const params = useParams();
  const personId = (params?.id as string) || '';

  const [state, setState] = useState<{ id: string; person: TMDBPersonDetails | null; error: 'not-found' | 'failed' | null } | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('popular');
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const requestKey = `${personId}-${retryKey}`;

  useEffect(() => {
    if (!personId) return;
    let ignore = false;
    getPersonDetails(personId)
      .then((data) => {
        if (ignore) return;
        setState({ id: requestKey, person: data, error: null });
        // Tint the page with the colours of the portrait
        if (data.profile_path) {
          extractPaletteFromImage(getImageUrl(data.profile_path, 'w185')).then((p) => !ignore && setPalette(p));
        }
      })
      .catch((err) => {
        if (!ignore) setState({ id: requestKey, person: null, error: isNotFoundError(err) ? 'not-found' : 'failed' });
      });
    return () => {
      ignore = true;
    };
  }, [personId, requestKey]);

  const current = state?.id === requestKey ? state : null;
  const person = current?.person ?? null;

  const { cast, crew, knownFor } = useMemo(() => {
    const castRaw = person?.combined_credits?.cast || [];
    const crewRaw = person?.combined_credits?.crew || [];
    const castMedia = uniqueMedia(castRaw);
    const crewMedia = uniqueMedia(crewRaw);
    // "Known for": the department they're known for, ranked by popularity, posters only
    const pool = person?.known_for_department && person.known_for_department !== 'Acting' ? crewMedia : castMedia;
    const known = [...pool]
      .filter((m) => m.posterPath)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15);
    return { cast: castMedia, crew: crewMedia, knownFor: known };
  }, [person]);

  const filmography = useMemo(() => {
    const base = filter === 'crew' ? crew : filter === 'all' ? cast : cast.filter((m) => m.type === filter);
    const list = base.filter((m) => m.posterPath);
    if (sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'newest') return [...list].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    return [...list].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [cast, crew, filter, sort]);

  if (!current) {
    return (
      <div className={cn(PAGE_GUTTER, 'pt-32 pb-20')} role="status" aria-label="Loading">
        <div className="flex flex-col md:flex-row gap-10 items-start animate-pulse">
          <div className="w-48 sm:w-64 aspect-[2/3] rounded-panel bg-surface-2" />
          <div className="flex-1 flex flex-col gap-4 w-full">
            <div className="h-5 w-32 rounded bg-surface-2" />
            <div className="h-12 w-2/3 rounded bg-surface-2" />
            <div className="h-24 w-full rounded bg-surface-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    const notFound = current.error !== 'failed';
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 text-center px-5">
        <h1 className="text-2xl font-bold text-white mb-2">{notFound ? 'Person not found' : "Couldn't load this profile"}</h1>
        <p className="text-muted text-sm mb-6">{notFound ? 'This profile does not exist on TMDB.' : 'Check your connection and try again.'}</p>
        <div className="flex gap-3">
          {!notFound && <Button onClick={() => setRetryKey((k) => k + 1)}>Try again</Button>}
          <LinkButton href="/" variant="secondary">
            Return home
          </LinkButton>
        </div>
      </div>
    );
  }

  const age = person.birthday ? ageOn(person.birthday, person.deathday) : null;
  const facts: [string, string][] = [
    ...(person.known_for_department ? ([['Known for', person.known_for_department]] as [string, string][]) : []),
    ...(person.birthday
      ? ([['Born', `${formatDateFull(person.birthday)}${!person.deathday && age !== null ? ` (age ${age})` : ''}`]] as [
          string,
          string,
        ][])
      : []),
    ...(person.deathday ? ([['Died', `${formatDateFull(person.deathday)}${age !== null ? ` (aged ${age})` : ''}`]] as [string, string][]) : []),
    ...(person.place_of_birth ? ([['Birthplace', person.place_of_birth]] as [string, string][]) : []),
    ['Credits', String(cast.length + crew.length)],
  ];

  return (
    <div className="w-full pb-28 lg:pb-16">
      <AmbientBackground palette={palette} />

      {/* Hero */}
      <section className={cn(PAGE_GUTTER, 'pt-28 lg:pt-36')}>
        <div className="grid md:grid-cols-[auto_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
          <div className="relative w-48 sm:w-60 lg:w-72 aspect-[2/3] rounded-panel overflow-hidden bg-surface-2 shadow-[0_30px_80px_rgb(0_0_0/0.55)] animate-scale-in mx-auto md:mx-0">
            {person.profile_path ? (
              <Image src={getImageUrl(person.profile_path, 'w500')} alt={person.name} fill priority sizes="288px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-subtle">
                <User className="w-16 h-16" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="animate-slide-up min-w-0">
            {person.known_for_department && (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{person.known_for_department}</p>
            )}
            <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.02]">{person.name}</h1>

            <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-panel bg-white/[0.04] px-5 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</dt>
                  <dd className="mt-1.5 text-sm sm:text-base font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>

            {person.biography ? (
              <div className="mt-8 max-w-3xl">
                <p className={cn('text-base sm:text-lg text-zinc-300 leading-relaxed whitespace-pre-line', !isBioExpanded && 'line-clamp-5')}>
                  {person.biography}
                </p>
                {person.biography.length > 420 && (
                  <button
                    type="button"
                    onClick={() => setIsBioExpanded((v) => !v)}
                    aria-expanded={isBioExpanded}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-accent transition-colors"
                  >
                    {isBioExpanded ? 'Show less' : 'Read more'}
                    <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', isBioExpanded && 'rotate-180')} aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-8 text-sm text-subtle">No biography available.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-20 sm:mt-28 flex flex-col gap-20 sm:gap-28">
        {knownFor.length >= 4 && <MediaCarousel title="Known for" items={knownFor} />}

        <RevealSection className={PAGE_GUTTER}>
          <SectionHeader title="Filmography" subtitle={`${filmography.length} titles`} className="mb-5" />
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
              <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </Chip>
              <Chip selected={filter === 'movie'} onClick={() => setFilter('movie')}>
                Movies
              </Chip>
              <Chip selected={filter === 'tv'} onClick={() => setFilter('tv')}>
                Series
              </Chip>
              {crew.length > 0 && (
                <Chip selected={filter === 'crew'} onClick={() => setFilter('crew')}>
                  Behind the camera
                </Chip>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sort">
              {(
                [
                  ['popular', 'Popular'],
                  ['rating', 'Top rated'],
                  ['newest', 'Newest'],
                ] as [Sort, string][]
              ).map(([id, label]) => (
                <Chip key={id} selected={sort === id} onClick={() => setSort(id)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          {filmography.length > 0 ? (
            <div key={`${filter}-${sort}`} className={cn('stagger animate-fade-in', GRID)}>
              {filmography.map((item, i) => (
                <div key={`${item.type}-${item.id}`} style={{ '--i': i % 12 } as React.CSSProperties}>
                  <MediaCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted">No titles for this filter.</p>
          )}
        </RevealSection>
      </div>
    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PersonContent />
    </Suspense>
  );
}
