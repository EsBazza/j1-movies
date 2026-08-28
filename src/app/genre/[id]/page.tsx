'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  ArrowUpDown,
  Film,
  Tv,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getMoviesByGenre,
  getTVByGenre,
  getMovieGenres,
  getTVGenres,
  normalizeMediaItem,
} from '@/lib/tmdb';
import { TMDBGenre, NormalizedMedia, MediaType } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';

// Static mapping fallback for popular TMDB genres
const GENRE_MAP: Record<string, string> = {
  '28': 'Action',
  '12': 'Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Science Fiction',
  '10770': 'TV Movie',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western',
  '10759': 'Action & Adventure',
  '10762': 'Kids',
  '10763': 'News',
  '10764': 'Reality',
  '10765': 'Sci-Fi & Fantasy',
  '10766': 'Soap',
  '10767': 'Talk',
  '10768': 'War & Politics',
};

function GenreContent({ genreId }: { genreId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const typeParam = (searchParams.get('type') as MediaType | 'all') || 'all';
  const sortParam = searchParams.get('sort_by') || 'popularity.desc';

  const [mediaType, setMediaType] = useState<MediaType | 'all'>(typeParam);
  const [sortBy, setSortBy] = useState<string>(sortParam);
  const [genreName, setGenreName] = useState<string>(GENRE_MAP[genreId] || 'Genre');
  const [items, setItems] = useState<NormalizedMedia[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Fetch Genre Name
  useEffect(() => {
    async function loadGenreName() {
      try {
        const [mRes, tRes] = await Promise.all([
          getMovieGenres().catch(() => ({ genres: [] })),
          getTVGenres().catch(() => ({ genres: [] })),
        ]);
        const allGenres = [...mRes.genres, ...tRes.genres];
        const match = allGenres.find((g) => String(g.id) === genreId);
        if (match) {
          setGenreName(match.name);
        }
      } catch (err) {
        console.error('Error fetching genre list:', err);
      }
    }
    loadGenreName();
  }, [genreId]);

  // Load Content for Genre
  useEffect(() => {
    async function loadGenreMedia() {
      setIsLoading(true);
      setPage(1);

      try {
        if (mediaType === 'movie') {
          const res = await getMoviesByGenre(genreId, 1, sortBy);
          const normalized = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
          setItems(normalized);
          setTotalPages(res.total_pages || 1);
        } else if (mediaType === 'tv') {
          const res = await getTVByGenre(genreId, 1, sortBy);
          const normalized = (res.results || []).map((t) => normalizeMediaItem(t, 'tv'));
          setItems(normalized);
          setTotalPages(res.total_pages || 1);
        } else {
          // Combined Movie & TV
          const [mRes, tRes] = await Promise.all([
            getMoviesByGenre(genreId, 1, sortBy).catch(() => ({ results: [], total_pages: 1 })),
            getTVByGenre(genreId, 1, sortBy).catch(() => ({ results: [], total_pages: 1 })),
          ]);

          const normMovies = (mRes.results || []).map((m) => normalizeMediaItem(m, 'movie'));
          const normTv = (tRes.results || []).map((t) => normalizeMediaItem(t, 'tv'));

          // Interleave or combine and sort locally
          const combined = [...normMovies, ...normTv];
          if (sortBy === 'vote_average.desc') {
            combined.sort((a, b) => b.rating - a.rating);
          } else {
            // By popularity
            combined.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          }

          setItems(combined);
          setTotalPages(Math.max(mRes.total_pages || 1, tRes.total_pages || 1));
        }
      } catch (err) {
        console.error('Failed to load genre media:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadGenreMedia();
  }, [genreId, mediaType, sortBy]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      if (mediaType === 'movie') {
        const res = await getMoviesByGenre(genreId, nextPage, sortBy);
        const newItems = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        setItems((prev) => [...prev, ...newItems]);
      } else if (mediaType === 'tv') {
        const res = await getTVByGenre(genreId, nextPage, sortBy);
        const newItems = (res.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        setItems((prev) => [...prev, ...newItems]);
      } else {
        const [mRes, tRes] = await Promise.all([
          getMoviesByGenre(genreId, nextPage, sortBy).catch(() => ({ results: [] })),
          getTVByGenre(genreId, nextPage, sortBy).catch(() => ({ results: [] })),
        ]);
        const newMovies = (mRes.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        const newTv = (tRes.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        setItems((prev) => [...prev, ...newMovies, ...newTv]);
      }
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more genre media:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTypeChange = (newType: MediaType | 'all') => {
    setMediaType(newType);
    router.replace(`/genre/${genreId}?type=${newType}&sort_by=${sortBy}`);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    router.replace(`/genre/${genreId}?type=${mediaType}&sort_by=${newSort}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Genre Explorer</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            {genreName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse all top-rated and trending titles under {genreName}.
          </p>
        </div>

        {/* Filters and Sorting Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleTypeChange('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                mediaType === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              All
            </button>
            <button
              onClick={() => handleTypeChange('movie')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                mediaType === 'movie'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              onClick={() => handleTypeChange('tv')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                mediaType === 'tv'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Series</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-zinc-400 flex items-center gap-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-red-500" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-white text-xs font-semibold rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:border-red-500 cursor-pointer shadow-lg transition-colors"
            >
              <option value="popularity.desc">🔥 Most Popular</option>
              <option value="vote_average.desc">⭐ Highest Rated</option>
              <option value="primary_release_date.desc">📅 Newest Releases</option>
              <option value="original_title.asc">🔤 Title (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
          {Array.from({ length: 15 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
            {items.map((item, index) => (
              <MediaCard
                key={`${item.type}-${item.id}-${index}`}
                item={item}
                priority={index < 5}
              />
            ))}
          </div>

          {/* Load More Button */}
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
                    <span>Loading {genreName} Titles...</span>
                  </>
                ) : (
                  <span>Load More {genreName} Titles</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-24 text-center text-zinc-400">
          No titles found for this genre filter.
        </div>
      )}
    </div>
  );
}

export default function GenrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const genreId = resolvedParams.id;

  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-zinc-400">Loading Genre...</div>}>
      <GenreContent genreId={genreId} />
    </Suspense>
  );
}
