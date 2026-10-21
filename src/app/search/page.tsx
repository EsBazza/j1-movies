'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Film, Tv, Sparkles, Loader2 } from 'lucide-react';
import { searchMulti, normalizeMediaItem } from '@/lib/tmdb';
import { NormalizedMedia, MediaType } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';

function dedupe(items: NormalizedMedia[]): NormalizedMedia[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.type}-${i.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState(false);
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

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }
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
        const filtered = dedupe(
          (res.results || [])
            .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
            .map((item) => normalizeMediaItem(item))
        );
        resultsQueryRef.current = trimmed;
        setResults(filtered);
        setTotalPages(res.total_pages || 1);
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
  }, [query, router]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    const forQuery = resultsQueryRef.current;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await searchMulti(forQuery, nextPage);
      if (resultsQueryRef.current !== forQuery) return;
      const newFiltered = (res.results || [])
        .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item) => normalizeMediaItem(item));

      setResults((prev) => dedupe([...prev, ...newFiltered]));
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more results:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedResults = results.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Search Input Bar */}
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-3">Search</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Movies, series and people.
        </p>

        <div className="relative flex items-center">
          <label htmlFor="search-page-input" className="sr-only">
            Search movies and TV series
          </label>
          <input
            id="search-page-input"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, character, or franchise..."
            className="w-full bg-zinc-900 text-base text-zinc-100 placeholder-zinc-500 pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-red-500 shadow-2xl transition-colors"
            autoFocus
          />
          <Search className="absolute left-4 w-5 h-5 text-zinc-400" aria-hidden="true" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-3 mt-4" role="group" aria-label="Filter results">
          <button
            onClick={() => setFilterType('all')}
            aria-pressed={filterType === 'all'}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              filterType === 'all'
                ? 'bg-accent text-on-accent shadow-lg'
                : 'bg-surface-1 text-zinc-400 hover:text-white'
            )}
          >
            All ({results.length})
          </button>
          <button
            onClick={() => setFilterType('movie')}
            aria-pressed={filterType === 'movie'}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              filterType === 'movie'
                ? 'bg-accent text-on-accent shadow-lg'
                : 'bg-surface-1 text-zinc-400 hover:text-white'
            )}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>
          <button
            onClick={() => setFilterType('tv')}
            aria-pressed={filterType === 'tv'}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              filterType === 'tv'
                ? 'bg-accent text-on-accent shadow-lg'
                : 'bg-surface-1 text-zinc-400 hover:text-white'
            )}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Shows</span>
          </button>
        </div>
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : query && displayedResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {displayedResults.map((item) => (
              <MediaCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-surface-1 hover:bg-zinc-800 text-white font-semibold text-sm transition-all hover:scale-105 shadow-lg"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Searching More Titles...</span>
                  </>
                ) : (
                  <span>Load More Results</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : searchError ? (
        <div className="py-20 text-center flex flex-col items-center justify-center" role="alert">
          <h2 className="text-lg font-bold text-white mb-1">Search is unavailable right now</h2>
          <p className="text-sm text-zinc-400 max-w-sm">Check your connection and try again in a moment.</p>
        </div>
      ) : query ? (
        <div className="py-20 text-center flex flex-col items-center justify-center" role="status">
          <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center text-subtle mb-4">
            <Search className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No matches found</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            We couldn&apos;t find any movies or TV series matching &quot;{query}&quot;. Try checking for typos or searching a different keyword.
          </p>
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-accent mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Start typing to search</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            Results update as you type.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-zinc-400">Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
