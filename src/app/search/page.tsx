'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Film, Tv, Sparkles, Loader2 } from 'lucide-react';
import { searchMulti, normalizeMediaItem } from '@/lib/tmdb';
import { NormalizedMedia, MediaType } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    async function executeSearch() {
      setIsLoading(true);
      setPage(1);

      try {
        const res = await searchMulti(query.trim(), 1);
        const filtered = (res.results || [])
          .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item) => normalizeMediaItem(item));

        setResults(filtered);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error('Failed to search TMDB:', err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(executeSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await searchMulti(query.trim(), nextPage);
      const newFiltered = (res.results || [])
        .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item) => normalizeMediaItem(item));

      setResults((prev) => [...prev, ...newFiltered]);
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
        <h1 className="text-3xl font-extrabold text-white mb-3">Search Media</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Find any movie or TV series across millions of titles.
        </p>

        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              router.replace(`/search?q=${encodeURIComponent(e.target.value)}`);
            }}
            placeholder="Search by title, character, or franchise..."
            className="w-full bg-zinc-900 text-base text-zinc-100 placeholder-zinc-500 pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-red-500 focus:outline-none shadow-2xl transition-all"
            autoFocus
          />
          <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
              filterType === 'all'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            )}
          >
            All Results ({results.length})
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
              filterType === 'movie'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            )}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>
          <button
            onClick={() => setFilterType('tv')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
              filterType === 'tv'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            )}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Shows</span>
          </button>
        </div>
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : query && displayedResults.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {displayedResults.map((item, index) => (
              <MediaCard key={`${item.type}-${item.id}-${index}`} item={item} />
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-sm transition-all hover:scale-105 cursor-pointer shadow-lg"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    <span>Searching More Titles...</span>
                  </>
                ) : (
                  <span>Load More Results</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : query ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No matches found</h3>
          <p className="text-sm text-zinc-400 max-w-sm">
            We couldn&apos;t find any movies or TV series matching &quot;{query}&quot;. Try checking for typos or searching a different keyword.
          </p>
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Discover Something New</h3>
          <p className="text-sm text-zinc-400 max-w-sm">
            Start typing above to search instantly across TMDB&apos;s global movie and TV catalog.
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
