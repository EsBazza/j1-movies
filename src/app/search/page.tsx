'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, History, User } from 'lucide-react';
import { searchMulti, getTrending, normalizeMediaItem, getImageUrl } from '@/lib/tmdb';
import { NormalizedMedia, TMDBMediaItem } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Chip } from '@/components/ui/Chip';
import { LoadMore } from '@/components/ui/LoadMore';
import { readRecentSearches, saveRecentSearch, clearRecentSearches } from '@/lib/recentSearches';
import { useReveal } from '@/lib/useReveal';

interface PersonResult {
  id: number;
  name: string;
  profilePath: string | null;
  knownFor: string;
}

type Filter = 'all' | 'movie' | 'tv' | 'person';

const GENRES: { id: number; name: string; type: 'movie' | 'tv' }[] = [
  { id: 28, name: 'Action', type: 'movie' },
  { id: 35, name: 'Comedy', type: 'movie' },
  { id: 18, name: 'Drama', type: 'movie' },
  { id: 27, name: 'Horror', type: 'movie' },
  { id: 878, name: 'Sci-Fi', type: 'movie' },
  { id: 10749, name: 'Romance', type: 'movie' },
  { id: 53, name: 'Thriller', type: 'movie' },
  { id: 16, name: 'Animation', type: 'movie' },
  { id: 80, name: 'Crime', type: 'tv' },
  { id: 9648, name: 'Mystery', type: 'tv' },
  { id: 99, name: 'Documentary', type: 'movie' },
  { id: 10751, name: 'Family', type: 'movie' },
];

const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10';

function dedupe(items: NormalizedMedia[]): NormalizedMedia[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.type}-${i.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitResults(raw: TMDBMediaItem[]) {
  const media = raw.filter((r) => r.media_type === 'movie' || r.media_type === 'tv').map((r) => normalizeMediaItem(r));
  const people: PersonResult[] = raw
    .filter((r) => (r.media_type as string | undefined) === 'person')
    .map((r) => {
      const p = r as unknown as { id: number; name: string; profile_path: string | null; known_for?: { title?: string; name?: string }[] };
      return {
        id: p.id,
        name: p.name,
        profilePath: p.profile_path,
        knownFor: (p.known_for || [])
          .slice(0, 2)
          .map((k) => k.title || k.name)
          .filter(Boolean)
          .join(', '),
      };
    });
  return { media, people };
}

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className={`reveal ${className ?? ''}`}>
      {children}
    </section>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>('all');
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // The query the current results belong to — guards "Load more" against a changed query
  const resultsQueryRef = useRef('');

  // Sync from the URL only when it changes externally (e.g. navbar search, back button)
  const lastUrlQueryRef = useRef(initialQuery);
  useEffect(() => {
    if (initialQuery !== lastUrlQueryRef.current) {
      lastUrlQueryRef.current = initialQuery;
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Empty-state content: recent searches + trending
  useEffect(() => {
    setRecent(readRecentSearches());
    let ignore = false;
    getTrending('all', 'day')
      .then((res) => {
        if (!ignore)
          setTrending(
            (res.results || [])
              .filter((r) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
              .slice(0, 12)
              .map((r) => normalizeMediaItem(r))
          );
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    let ignore = false;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setSearchError(false);
      setPage(1);
      // Keep the URL shareable without fighting the user's typing
      lastUrlQueryRef.current = trimmed;
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });

      try {
        const res = await searchMulti(trimmed, 1);
        if (ignore) return;
        const split = splitResults(res.results || []);
        resultsQueryRef.current = trimmed;
        setResults(dedupe(split.media));
        setPeople(split.people);
        setTotalPages(res.total_pages || 1);
        if (split.media.length || split.people.length) {
          saveRecentSearch(trimmed);
          setRecent(readRecentSearches());
        }
      } catch (err) {
        if (ignore) return;
        console.error('Failed to search TMDB:', err);
        setSearchError(true);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [trimmed, router]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    const forQuery = resultsQueryRef.current;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await searchMulti(forQuery, nextPage);
      if (resultsQueryRef.current !== forQuery) return;
      const split = splitResults(res.results || []);
      setResults((prev) => dedupe([...prev, ...split.media]));
      setPeople((prev) => [...prev, ...split.people.filter((p) => !prev.some((x) => x.id === p.id))]);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more results:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: results.length + people.length,
      movie: results.filter((r) => r.type === 'movie').length,
      tv: results.filter((r) => r.type === 'tv').length,
      person: people.length,
    }),
    [results, people]
  );
  const shownMedia = filter === 'all' ? results : filter === 'person' ? [] : results.filter((r) => r.type === filter);
  const shownPeople = filter === 'all' || filter === 'person' ? people : [];

  const hasQuery = trimmed.length > 0;

  return (
    <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pt-28 lg:pt-32 pb-28 lg:pb-16">
      {/* Big centred search field */}
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">Search</h1>
        <p className="text-sm sm:text-base text-muted mt-2">Movies, series and people.</p>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            inputRef.current?.blur();
          }}
          className="relative mt-8"
        >
          <label htmlFor="search-page-input" className="sr-only">
            Search movies, series and people
          </label>
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted pointer-events-none" aria-hidden="true" />
          <input
            ref={inputRef}
            id="search-page-input"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titles, characters, actors…"
            autoFocus
            className="w-full h-16 sm:h-[72px] pl-16 pr-14 rounded-full text-base sm:text-lg text-white placeholder:text-subtle bg-[color-mix(in_srgb,var(--dyn-glow-1)_14%,rgb(255_255_255/0.06))] backdrop-blur-xl border border-transparent focus:border-accent shadow-[0_20px_60px_rgb(0_0_0/0.35)] transition-[border-color,background-color] duration-300 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </form>

        {hasQuery && !isLoading && !searchError && counts.all > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-in" role="group" aria-label="Filter results">
            {(
              [
                ['all', 'All'],
                ['movie', 'Movies'],
                ['tv', 'Series'],
                ['person', 'People'],
              ] as [Filter, string][]
            ).map(([id, label]) =>
              counts[id] > 0 || id === 'all' ? (
                <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>
                  {label} <span className="opacity-60">{counts[id]}</span>
                </Chip>
              ) : null
            )}
          </div>
        )}
      </div>

      <div className="mt-16 sm:mt-20 flex flex-col gap-20 sm:gap-24">
        {!hasQuery ? (
          <>
            {recent.length > 0 && (
              <RevealSection>
                <SectionHeader title="Recent searches">
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentSearches();
                      setRecent([]);
                    }}
                    className="text-xs sm:text-sm font-semibold text-muted hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </SectionHeader>
                <div className="stagger flex flex-wrap gap-2">
                  {recent.map((q, i) => (
                    <button
                      key={q}
                      type="button"
                      style={{ '--i': i } as React.CSSProperties}
                      onClick={() => setQuery(q)}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/8 hover:bg-white/15 text-sm text-zinc-200 hover:text-white transition-colors"
                    >
                      <History className="w-4 h-4 text-subtle" aria-hidden="true" />
                      {q}
                    </button>
                  ))}
                </div>
              </RevealSection>
            )}

            <RevealSection>
              <SectionHeader title="Browse by genre" />
              <div className="stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {GENRES.map((g, i) => (
                  <Link
                    key={g.id}
                    href={`/genre/${g.id}?type=${g.type}`}
                    style={{ '--i': i } as React.CSSProperties}
                    className="group relative h-20 sm:h-24 rounded-panel overflow-hidden flex items-end p-4 bg-[color-mix(in_srgb,var(--dyn-glow-2)_18%,rgb(255_255_255/0.05))] hover:bg-[color-mix(in_srgb,var(--dyn-glow-1)_30%,rgb(255_255_255/0.06))] transition-colors duration-300"
                  >
                    <span className="font-display text-base sm:text-lg font-bold text-white transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5">
                      {g.name}
                    </span>
                  </Link>
                ))}
              </div>
            </RevealSection>

            {trending.length > 0 && (
              <RevealSection>
                <SectionHeader title="Trending today" />
                <div className={`stagger ${GRID}`}>
                  {trending.map((item, i) => (
                    <div key={`${item.type}-${item.id}`} style={{ '--i': i } as React.CSSProperties}>
                      <MediaCard item={item} />
                    </div>
                  ))}
                </div>
              </RevealSection>
            )}
          </>
        ) : isLoading ? (
          <div className={GRID} role="status" aria-label="Searching">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : searchError ? (
          <div className="py-16 text-center" role="alert">
            <h2 className="text-xl font-bold text-white">Search is unavailable right now</h2>
            <p className="text-sm text-muted mt-2">Check your connection and try again in a moment.</p>
          </div>
        ) : counts.all === 0 ? (
          <div className="py-16 text-center" role="status">
            <h2 className="text-xl font-bold text-white">No matches for &ldquo;{trimmed}&rdquo;</h2>
            <p className="text-sm text-muted mt-2">Check the spelling or try a different title, character or actor.</p>
          </div>
        ) : (
          <>
            {shownPeople.length > 0 && (
              <RevealSection>
                <SectionHeader title="People" />
                <ul className="stagger flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
                  {shownPeople.slice(0, 20).map((p, i) => (
                    <li key={p.id} style={{ '--i': i } as React.CSSProperties} className="flex-shrink-0 w-24 sm:w-28">
                      <Link href={`/person/${p.id}`} className="group flex flex-col items-center text-center">
                        <span className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-surface-2 transition-transform duration-300 ease-out-expo group-hover:scale-105">
                          {p.profilePath ? (
                            <Image src={getImageUrl(p.profilePath, 'w185')} alt="" fill sizes="112px" className="object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-subtle">
                              <User className="w-8 h-8" aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <span className="mt-3 text-sm font-medium text-zinc-100 group-hover:text-white line-clamp-1">{p.name}</span>
                        {p.knownFor && <span className="text-xs text-subtle line-clamp-1">{p.knownFor}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </RevealSection>
            )}

            {shownMedia.length > 0 && (
              <RevealSection>
                <SectionHeader title={filter === 'movie' ? 'Movies' : filter === 'tv' ? 'Series' : 'Titles'} />
                <div className={`stagger ${GRID}`}>
                  {shownMedia.map((item, i) => (
                    <div key={`${item.type}-${item.id}`} style={{ '--i': i % 12 } as React.CSSProperties}>
                      <MediaCard item={item} />
                    </div>
                  ))}
                </div>
                {page < totalPages && <LoadMore onLoadMore={handleLoadMore} isLoading={isLoadingMore} label="More results" />}
              </RevealSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SearchContent />
    </Suspense>
  );
}
