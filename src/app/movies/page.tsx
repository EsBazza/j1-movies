'use client';

import React, { useState, useEffect } from 'react';
import { Film, Filter, Loader2 } from 'lucide-react';
import {
  getPopularMovies,
  getMoviesByGenre,
  getMovieGenres,
  normalizeMediaItem,
} from '@/lib/tmdb';
import { TMDBGenre, NormalizedMedia } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { GenrePills } from '@/components/media/GenrePills';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ApiKeyWarning } from '@/components/common/ApiKeyWarning';

export default function MoviesPage() {
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [movies, setMovies] = useState<NormalizedMedia[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fetch Genres
  useEffect(() => {
    async function loadGenres() {
      try {
        const res = await getMovieGenres();
        setGenres(res.genres || []);
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    }
    loadGenres();
  }, []);

  // Fetch Movies on genre change or initial load
  useEffect(() => {
    async function loadMovies() {
      setIsLoading(true);
      setHasError(false);
      setPage(1);

      try {
        const res = selectedGenreId
          ? await getMoviesByGenre(selectedGenreId, 1)
          : await getPopularMovies(1);

        const items = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        setMovies(items);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error('Failed to load movies:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadMovies();
  }, [selectedGenreId]);

  // Load More Pages
  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = selectedGenreId
        ? await getMoviesByGenre(selectedGenreId, nextPage)
        : await getPopularMovies(nextPage);

      const newItems = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
      setMovies((prev) => [...prev, ...newItems]);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more movies:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
            <Film className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Movies Catalog</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Browse blockbuster films, classics, and newly released cinema.
            </p>
          </div>
        </div>

        {/* Genre Pill Filter */}
        <div className="w-full md:w-auto max-w-2xl">
          <GenrePills
            genres={genres}
            activeGenreId={selectedGenreId}
            onSelectGenre={setSelectedGenreId}
          />
        </div>
      </div>

      {/* Content Grid */}
      {hasError ? (
        <ApiKeyWarning />
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
          {Array.from({ length: 15 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
            {movies.map((movie, index) => (
              <MediaCard
                key={`${movie.id}-${index}`}
                item={movie}
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
                    <span>Loading Cinema...</span>
                  </>
                ) : (
                  <span>Load More Movies</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-zinc-400">
          No movies found for this category.
        </div>
      )}
    </div>
  );
}
