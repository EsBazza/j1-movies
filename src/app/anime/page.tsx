'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Flame,
  Star,
  Film,
  Tv,
  Loader2,
  Swords,
  Heart,
} from 'lucide-react';
import {
  getTrendingAnime,
  getPopularAnime,
  getTopRatedAnime,
  getAnimeMovies,
  getTVByGenre,
  discoverMedia,
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

export default function AnimeHubPage() {
  const [heroItem, setHeroItem] = useState<NormalizedMedia | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);

  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [popular, setPopular] = useState<NormalizedMedia[]>([]);
  const [topRated, setTopRated] = useState<NormalizedMedia[]>([]);
  const [movies, setMovies] = useState<NormalizedMedia[]>([]);
  const [actionAnime, setActionAnime] = useState<NormalizedMedia[]>([]);
  const [fantasyAnime, setFantasyAnime] = useState<NormalizedMedia[]>([]);

  // Filter Catalog State
  const [activeSubGenreId, setActiveSubGenreId] = useState<string>('all');
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    minRating: 0,
    language: '',
    sortBy: 'popularity.desc',
    format: 'all',
  });

  const [catalogAnime, setCatalogAnime] = useState<NormalizedMedia[]>([]);
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
      extractPaletteFromImage(sampleUrl, genreId || 16).then(setPalette);
    } else {
      setPalette(getPaletteForGenre(genreId || 16));
    }
  }, []);

  useEffect(() => {
    async function loadAnimeData() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [
          trendingRes,
          popularRes,
          topRatedRes,
          moviesRes,
          actionRes,
          fantasyRes,
        ] = await Promise.all([
          getTrendingAnime(1),
          getPopularAnime(1),
          getTopRatedAnime(1),
          getAnimeMovies(1),
          getTVByGenre(10759, 1).catch(() => null), // Action & Adventure TV
          getTVByGenre(10765, 1).catch(() => null), // Sci-Fi & Fantasy TV
        ]);

        const normTrending = (trendingRes.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normPopular = (popularRes.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normTopRated = (topRatedRes.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normMovies = (moviesRes.results || []).map((i) => normalizeMediaItem(i, 'movie'));
        const normAction = (actionRes?.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normFantasy = (fantasyRes?.results || []).map((i) => normalizeMediaItem(i, 'tv'));

        setTrending(normTrending);
        setPopular(normPopular);
        setTopRated(normTopRated);
        setMovies(normMovies);
        setActionAnime(normAction);
        setFantasyAnime(normFantasy);

        const featured = normTrending.length > 0 ? normTrending : normPopular;
        if (featured.length > 0) {
          setHeroItem(featured[0]);
          handleActiveHeroChange(featured[0]);
        }
      } catch (err) {
        console.error('Failed to load anime hub data:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnimeData();
  }, [handleActiveHeroChange]);

  const activeSubGenreObj = HUB_CONFIGS.anime.subGenres.find((s) => s.id === activeSubGenreId);

  // When filters are engaged, fetch targeted catalog
  const isFiltering = Boolean(
    activeSubGenreId !== 'all' ||
    filters.year ||
    filters.minRating > 0 ||
    filters.sortBy !== 'popularity.desc' ||
    (filters.format && filters.format !== 'all')
  );

  useEffect(() => {
    if (!isFiltering) return;

    async function loadFiltered() {
      setIsLoadingCatalog(true);
      setPage(1);

      try {
        const targetMediaType = filters.format && filters.format !== 'all' ? filters.format : 'tv';
        // Combine Animation (16) with subgenre if applicable
        const genreParam = activeSubGenreObj?.genreId
          ? `16,${activeSubGenreObj.genreId}`
          : '16';

        const res = await discoverMedia({
          mediaType: targetMediaType,
          genreId: genreParam,
          withKeywords: activeSubGenreObj?.keywordId ? String(activeSubGenreObj.keywordId) : undefined,
          sortBy: filters.sortBy,
          minRating: filters.minRating,
          year: filters.year,
          language: 'ja',
          withOriginalLanguage: 'ja',
          withOriginCountry: 'JP',
          page: 1,
        });

        const items = (res.results || []).map((item) => normalizeMediaItem(item, targetMediaType));
        setCatalogAnime(items);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error('Failed to load filtered anime:', err);
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
      const targetMediaType = filters.format && filters.format !== 'all' ? filters.format : 'tv';
      const genreParam = activeSubGenreObj?.genreId
        ? `16,${activeSubGenreObj.genreId}`
        : '16';

      const res = await discoverMedia({
        mediaType: targetMediaType,
        genreId: genreParam,
        withKeywords: activeSubGenreObj?.keywordId ? String(activeSubGenreObj.keywordId) : undefined,
        sortBy: filters.sortBy,
        minRating: filters.minRating,
        year: filters.year,
        language: 'ja',
        withOriginalLanguage: 'ja',
        withOriginCountry: 'JP',
        page: nextPage,
      });

      const newItems = (res.results || []).map((item) => normalizeMediaItem(item, targetMediaType));
      setCatalogAnime((prev) => [...prev, ...newItems]);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more anime:', err);
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
      format: 'all',
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

  const featuredItems = trending.length > 0 ? trending.slice(0, 8) : popular.slice(0, 8);
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
        {/* Interactive Explore Console for Anime */}
        <ExploreConsole
          title="Explore Anime"
          icon={Sparkles}
          subGenres={HUB_CONFIGS.anime.subGenres}
          activeSubGenreId={activeSubGenreId}
          onSelectSubGenre={setActiveSubGenreId}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          isFiltering={isFiltering}
          totalResultsCount={catalogAnime.length}
          allowFormatSwitch={true}
        />

        {/* Dynamic Display: If user filtered, show instant 6-column widescreen grid. Otherwise, show cinema shelves */}
        {isFiltering ? (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white">
              Filtered Anime ({activeSubGenreObj?.name || 'Custom'})
            </h3>
            {isLoadingCatalog ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {Array.from({ length: 18 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : catalogAnime.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {catalogAnime.map((anime, index) => (
                    <MediaCard
                      key={`${anime.id}-${index}`}
                      item={anime}
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
                          <span>Loading Anime...</span>
                        </>
                      ) : (
                        <span>Load More Anime</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-zinc-400">
                No anime found matching these filter criteria.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Trending Anime with Big Bold Ranked Numbers */}
            <MediaCarousel
              title="Trending Anime"
              items={trending}
              showRank={true}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Top Rated Masterpieces */}
            <MediaCarousel
              title="Top Rated Masterpieces"
              icon={Star}
              items={topRated}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Anime Cinema & Feature Films */}
            <MediaCarousel
              title="Anime Feature Films"
              icon={Film}
              items={movies}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Fan Favorites */}
            <MediaCarousel
              title="Fan Favorites"
              icon={Sparkles}
              items={popular}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Action & Shonen Hits */}
            <MediaCarousel
              title="Action & Shonen Hits"
              icon={Swords}
              items={actionAnime}
              isLoading={isLoading}
              fullWidth={true}
            />

            {/* Fantasy & Otherworldly Adventures */}
            <MediaCarousel
              title="Fantasy & Other Worlds"
              icon={Sparkles}
              items={fantasyAnime}
              isLoading={isLoading}
              fullWidth={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
