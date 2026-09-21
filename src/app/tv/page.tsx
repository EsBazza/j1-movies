'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tv,
  Flame,
  Star,
  Sparkles,
  TrendingUp,
  Clapperboard,
  Loader2,
} from 'lucide-react';
import {
  discoverMedia,
  getTrending,
  getPopularTV,
  getTopRatedTV,
  getTVByGenre,
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

export default function TVSeriesPage() {
  const [heroItem, setHeroItem] = useState<NormalizedMedia | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);

  const [trendingShows, setTrendingShows] = useState<NormalizedMedia[]>([]);
  const [popularShows, setPopularShows] = useState<NormalizedMedia[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<NormalizedMedia[]>([]);
  const [dramaShows, setDramaShows] = useState<NormalizedMedia[]>([]);
  const [sciFiShows, setSciFiShows] = useState<NormalizedMedia[]>([]);
  const [comedyShows, setComedyShows] = useState<NormalizedMedia[]>([]);

  // Filter Catalog
  const [activeSubGenreId, setActiveSubGenreId] = useState<string>('all');
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    minRating: 0,
    language: '',
    sortBy: 'popularity.desc',
  });

  const [catalogShows, setCatalogShows] = useState<NormalizedMedia[]>([]);
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
    async function loadTVData() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [
          trendingRes,
          popShowsRes,
          topShowsRes,
          dramaRes,
          sciFiRes,
          comedyRes,
        ] = await Promise.all([
          getTrending('tv', 'day').catch(() => null),
          getPopularTV(1).catch(() => null),
          getTopRatedTV(1).catch(() => null),
          getTVByGenre(18, 1).catch(() => null), // Drama
          getTVByGenre(10765, 1).catch(() => null), // Sci-Fi & Fantasy
          getTVByGenre(35, 1).catch(() => null), // Comedy
        ]);

        const normTrending = (trendingRes?.results || [])
          .filter((i) => i.poster_path && i.backdrop_path)
          .map((t) => normalizeMediaItem(t, 'tv'));
        const normPopular = (popShowsRes?.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        const normTopRated = (topShowsRes?.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        const normDrama = (dramaRes?.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        const normSciFi = (sciFiRes?.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        const normComedy = (comedyRes?.results || []).map((t) => normalizeMediaItem(t, 'tv'));

        setTrendingShows(normTrending);
        setPopularShows(normPopular);
        setTopRatedShows(normTopRated);
        setDramaShows(normDrama);
        setSciFiShows(normSciFi);
        setComedyShows(normComedy);

        const featured = normTrending.length > 0 ? normTrending : normPopular;
        if (featured.length > 0) {
          setHeroItem(featured[0]);
          handleActiveHeroChange(featured[0]);
        }
      } catch (err) {
        console.error('Failed to load TV series data:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadTVData();
  }, [handleActiveHeroChange]);

  const activeSubGenreObj = HUB_CONFIGS.tv.subGenres.find((s) => s.id === activeSubGenreId);

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
          mediaType: 'tv',
          genreId: activeSubGenreObj?.genreId || undefined,
          withKeywords: activeSubGenreObj?.keywordId ? String(activeSubGenreObj.keywordId) : undefined,
          sortBy: filters.sortBy,
          minRating: filters.minRating,
          year: filters.year,
          language: filters.language,
          page: 1,
        });

        const items = (res.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        setCatalogShows(items);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error('Failed to load filtered series:', err);
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
        mediaType: 'tv',
        genreId: activeSubGenreObj?.genreId || undefined,
        withKeywords: activeSubGenreObj?.keywordId ? String(activeSubGenreObj.keywordId) : undefined,
        sortBy: filters.sortBy,
        minRating: filters.minRating,
        year: filters.year,
        language: filters.language,
        page: nextPage,
      });

      const newItems = (res.results || []).map((t) => normalizeMediaItem(t, 'tv'));
      setCatalogShows((prev) => [...prev, ...newItems]);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more TV shows:', err);
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

  const featuredItems = trendingShows.length > 0 ? trendingShows.slice(0, 8) : popularShows.slice(0, 8);
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
          title="Explore TV Series"
          icon={Tv}
          subGenres={HUB_CONFIGS.tv.subGenres}
          activeSubGenreId={activeSubGenreId}
          onSelectSubGenre={setActiveSubGenreId}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          isFiltering={isFiltering}
          totalResultsCount={catalogShows.length}
        />

        {/* Dynamic Display: If user filtered, show instant 6-column widescreen grid. Otherwise, show cinema shelves */}
        {isFiltering ? (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white">
              Filtered Series ({activeSubGenreObj?.name || 'Custom'})
            </h3>
            {isLoadingCatalog ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {Array.from({ length: 18 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : catalogShows.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {catalogShows.map((show, index) => (
                    <MediaCard
                      key={`${show.id}-${index}`}
                      item={show}
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
                          <span>Loading TV Series...</span>
                        </>
                      ) : (
                        <span>Load More TV Series</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-zinc-400">
                No TV shows found matching these filter criteria.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Trending TV Series with Big Bold Ranked Numbers */}
            <MediaCarousel
              title="Trending TV Series"
              items={trendingShows}
              showRank={true}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Binge-Worthy TV Series */}
            <MediaCarousel
              title="Binge-Worthy TV Series"
              items={popularShows}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Critically Acclaimed Series */}
            <MediaCarousel
              title="Critically Acclaimed Series"
              items={topRatedShows}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Gripping Drama Series */}
            <MediaCarousel
              title="Gripping Drama Series"
              items={dramaShows}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Sci-Fi & Fantasy Universes */}
            <MediaCarousel
              title="Sci-Fi & Fantasy Universes"
              items={sciFiShows}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Comedy & Sitcom Hits */}
            <MediaCarousel
              title="Comedy & Sitcom Hits"
              items={comedyShows}
              isLoading={isLoading}
              fullWidth={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
