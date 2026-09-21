'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  Flame,
  Star,
  Sparkles,
  TrendingUp,
  Swords,
  Loader2,
} from 'lucide-react';
import {
  discoverMedia,
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getMoviesByGenre,
  normalizeMediaItem,
  getBackdropUrl,
} from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { ExploreConsole, FilterState } from '@/components/media/ExploreConsole';
import { HUB_CONFIGS } from '@/lib/hubExploreConfigs';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { ApiKeyWarning } from '@/components/common/ApiKeyWarning';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { HeroBanner } from '@/components/media/HeroBanner';
import {
  extractPaletteFromImage,
  getPaletteForGenre,
  DEFAULT_PALETTE,
  ExtractedPalette,
} from '@/lib/colorExtractor';

export default function MoviesPage() {
  const [heroItem, setHeroItem] = useState<NormalizedMedia | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);

  const [trendingMovies, setTrendingMovies] = useState<NormalizedMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<NormalizedMedia[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<NormalizedMedia[]>([]);
  const [actionMovies, setActionMovies] = useState<NormalizedMedia[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<NormalizedMedia[]>([]);
  const [comedyMovies, setComedyMovies] = useState<NormalizedMedia[]>([]);

  // Filter Catalog
  const [activeSubGenreId, setActiveSubGenreId] = useState<string>('all');
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    minRating: 0,
    language: '',
    sortBy: 'popularity.desc',
  });

  const [catalogMovies, setCatalogMovies] = useState<NormalizedMedia[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Dynamic Color Extraction
  const handleActiveHeroChange = useCallback((activeItem: NormalizedMedia) => {
    setHeroItem(activeItem);
    const genreId = activeItem.genres?.[0]?.id;
    if (activeItem.backdropPath || activeItem.posterPath) {
      const sampleUrl = getBackdropUrl(activeItem.backdropPath || activeItem.posterPath, 'w780');
      extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
    } else if (genreId) {
      setPalette(getPaletteForGenre(genreId));
    }
  }, []);

  // Initial Content Loading
  useEffect(() => {
    async function loadMoviesData() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [
          trendingRes,
          popMoviesRes,
          topMoviesRes,
          actionRes,
          sciFiRes,
          comedyRes,
        ] = await Promise.all([
          getTrending('movie', 'day').catch(() => null),
          getPopularMovies(1).catch(() => null),
          getTopRatedMovies(1).catch(() => null),
          getMoviesByGenre(28, 1).catch(() => null), // Action
          getMoviesByGenre(878, 1).catch(() => null), // Sci-Fi
          getMoviesByGenre(35, 1).catch(() => null), // Comedy
        ]);

        const normTrending = (trendingRes?.results || [])
          .filter((i) => i.poster_path && i.backdrop_path)
          .map((m) => normalizeMediaItem(m, 'movie'));
        const normPopular = (popMoviesRes?.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        const normTopRated = (topMoviesRes?.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        const normAction = (actionRes?.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        const normSciFi = (sciFiRes?.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        const normComedy = (comedyRes?.results || []).map((m) => normalizeMediaItem(m, 'movie'));

        setTrendingMovies(normTrending);
        setPopularMovies(normPopular);
        setTopRatedMovies(normTopRated);
        setActionMovies(normAction);
        setSciFiMovies(normSciFi);
        setComedyMovies(normComedy);

        const featured = normTrending.length > 0 ? normTrending : normPopular;
        if (featured.length > 0) {
          setHeroItem(featured[0]);
          handleActiveHeroChange(featured[0]);
        }
      } catch (err) {
        console.error('Failed to load movies data:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadMoviesData();
  }, [handleActiveHeroChange]);

  const activeSubGenreObj = HUB_CONFIGS.movies.subGenres.find((s) => s.id === activeSubGenreId);

  // When filters are engaged, fetch targeted catalog
  const isFiltering = Boolean(
    activeSubGenreId !== 'all' ||
    filters.year ||
    filters.minRating > 0 ||
    filters.language ||
    filters.sortBy !== 'popularity.desc'
  );

  useEffect(() => {
    if (!isFiltering) return;

    async function loadFiltered() {
      setIsLoadingCatalog(true);
      setPage(1);

      try {
        const res = await discoverMedia({
          mediaType: 'movie',
          genreId: activeSubGenreObj?.genreId || undefined,
          withKeywords: activeSubGenreObj?.keywordId ? String(activeSubGenreObj.keywordId) : undefined,
          sortBy: filters.sortBy,
          minRating: filters.minRating,
          year: filters.year,
          language: filters.language,
          page: 1,
        });

        const items = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        setCatalogMovies(items);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error('Failed to load filtered movies:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }

    loadFiltered();
  }, [isFiltering, activeSubGenreId, activeSubGenreObj, filters]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await discoverMedia({
        mediaType: 'movie',
        genreId: activeSubGenreObj?.genreId || undefined,
        withKeywords: activeSubGenreObj?.keywordId ? String(activeSubGenreObj.keywordId) : undefined,
        sortBy: filters.sortBy,
        minRating: filters.minRating,
        year: filters.year,
        language: filters.language,
        page: nextPage,
      });

      const newItems = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
      setCatalogMovies((prev) => [...prev, ...newItems]);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more movies:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      year: '',
      minRating: 0,
      language: '',
      sortBy: 'popularity.desc',
    });
    setActiveSubGenreId('all');
  };

  if (hasError) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-16">
        <ApiKeyWarning />
      </div>
    );
  }

  const featuredItems = trendingMovies.length > 0 ? trendingMovies.slice(0, 8) : popularMovies.slice(0, 8);
  const activeHero = heroItem || featuredItems[0];

  return (
    <div className="flex flex-col w-full pb-32 relative bg-transparent min-h-screen">
      {/* 1. Dynamic Multi-Color Ambient Lighting Canvas (Identical to Home Page) */}
      <AmbientBackground
        backdropPath={activeHero?.backdropPath}
        posterPath={activeHero?.posterPath}
        palette={palette}
      />

      {/* 2. Hero Spotlight Carousel Section (Identical to Home Page) */}
      <div className="relative z-10">
        {isLoading ? (
          <SkeletonBanner />
        ) : (
          <HeroBanner
            items={featuredItems}
            item={heroItem || featuredItems[0]}
            palette={palette}
            onActiveItemChange={handleActiveHeroChange}
          />
        )}
      </div>

      {/* 3. Spacious Content Rows */}
      <div className="relative pt-6 sm:pt-10 md:pt-14 z-20 flex flex-col gap-12 sm:gap-16 md:gap-20 max-w-[1750px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Interactive Explore Console */}
        <ExploreConsole
          title="Explore Movies"
          icon={Film}
          subGenres={HUB_CONFIGS.movies.subGenres}
          activeSubGenreId={activeSubGenreId}
          onSelectSubGenre={setActiveSubGenreId}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          isFiltering={isFiltering}
          totalResultsCount={catalogMovies.length}
        />

        {/* Dynamic Display: If user filtered, show instant 6-column widescreen grid. Otherwise, show cinema shelves */}
        {isFiltering ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Filtered Movies ({activeSubGenreObj?.name || 'Custom'})
              </h3>
            </div>
            {isLoadingCatalog ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {Array.from({ length: 18 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : catalogMovies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {catalogMovies.map((movie, index) => (
                    <MediaCard
                      key={`${movie.id}-${index}`}
                      item={movie}
                      priority={index < 6}
                    />
                  ))}
                </div>

                {page < totalPages && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-sm transition-all hover:scale-105 cursor-pointer shadow-lg"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          <span>Loading Movies...</span>
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
                No movies found matching these filter criteria.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Trending Movies with Big Bold Ranked Numbers */}
            <MediaCarousel
              title="Trending Movies"
              items={trendingMovies}
              showRank={true}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Blockbuster Cinema */}
            <MediaCarousel
              title="Blockbuster Cinema"
              items={popularMovies}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Critically Acclaimed */}
            <MediaCarousel
              title="Critically Acclaimed"
              items={topRatedMovies}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Action Blockbusters */}
            <MediaCarousel
              title="Action Blockbusters"
              items={actionMovies}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Sci-Fi & Future Worlds */}
            <MediaCarousel
              title="Sci-Fi & Future Worlds"
              items={sciFiMovies}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Comedy Favorites */}
            <MediaCarousel
              title="Comedy Favorites"
              items={comedyMovies}
              isLoading={isLoading}
              fullWidth={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
