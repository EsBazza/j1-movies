'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Flame, Star, Film, Tv, Sparkles, Swords, Heart } from 'lucide-react';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getPopularTV,
  getMoviesByGenre,
  getTrendingAnime,
  getPopularKDrama,
  normalizeMediaItem,
  getBackdropUrl,
} from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { extractPaletteFromImage, getPaletteForGenre, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { HeroBanner } from '@/components/media/HeroBanner';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { ContinueWatchingRow } from '@/components/media/ContinueWatchingRow';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { ApiKeyWarning } from '@/components/common/ApiKeyWarning';
import { AmbientBackground } from '@/components/media/AmbientBackground';

export default function HomePage() {
  const [heroItem, setHeroItem] = useState<NormalizedMedia | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<NormalizedMedia[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<NormalizedMedia[]>([]);
  const [popularTV, setPopularTV] = useState<NormalizedMedia[]>([]);
  const [actionMovies, setActionMovies] = useState<NormalizedMedia[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<NormalizedMedia[]>([]);
  const [animeList, setAnimeList] = useState<NormalizedMedia[]>([]);
  const [kdramaList, setKdramaList] = useState<NormalizedMedia[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

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

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        setApiError(false);

        const [
          trendingRes,
          popMoviesRes,
          topMoviesRes,
          popTvRes,
          actionRes,
          sciFiRes,
          animeRes,
          kdramaRes,
        ] = await Promise.all([
          getTrending('all', 'day').catch(() => null),
          getPopularMovies(1).catch(() => null),
          getTopRatedMovies(1).catch(() => null),
          getPopularTV(1).catch(() => null),
          getMoviesByGenre(28, 1).catch(() => null), // 28: Action
          getMoviesByGenre(878, 1).catch(() => null), // 878: Sci-Fi
          getTrendingAnime(1).catch(() => null),
          getPopularKDrama(1).catch(() => null),
        ]);

        if (!trendingRes && !popMoviesRes) {
          setApiError(true);
          return;
        }

        const normalizedTrending = (trendingRes?.results || [])
          .filter((i) => i.poster_path && i.backdrop_path)
          .map((i) => normalizeMediaItem(i));

        const normalizedPopMovies = (popMoviesRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'movie')
        );
        const normalizedTopMovies = (topMoviesRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'movie')
        );
        const normalizedPopTV = (popTvRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'tv')
        );
        const normalizedAction = (actionRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'movie')
        );
        const normalizedSciFi = (sciFiRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'movie')
        );
        const normalizedAnime = (animeRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'tv')
        );
        const normalizedKDrama = (kdramaRes?.results || []).map((i) =>
          normalizeMediaItem(i, 'tv')
        );

        setTrending(normalizedTrending);
        setPopularMovies(normalizedPopMovies);
        setTopRatedMovies(normalizedTopMovies);
        setPopularTV(normalizedPopTV);
        setActionMovies(normalizedAction);
        setSciFiMovies(normalizedSciFi);
        setAnimeList(normalizedAnime);
        setKdramaList(normalizedKDrama);

        // Initial featured item
        const featured = normalizedTrending.length > 0 ? normalizedTrending[0] : normalizedPopMovies[0];
        if (featured) {
          setHeroItem(featured);
          const genreId = featured.genres?.[0]?.id;
          if (featured.backdropPath || featured.posterPath) {
            const sampleUrl = getBackdropUrl(featured.backdropPath || featured.posterPath, 'w780');
            extractPaletteFromImage(sampleUrl, genreId).then(setPalette);
          } else if (genreId) {
            setPalette(getPaletteForGenre(genreId));
          }
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
        setApiError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  if (apiError) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-16">
        <ApiKeyWarning />
      </div>
    );
  }

  const featuredItems = trending.length > 0 ? trending.slice(0, 8) : popularMovies.slice(0, 8);
  const activeHero = heroItem || featuredItems[0];

  return (
    <div className="flex flex-col w-full pb-32 relative bg-transparent min-h-screen">
      {/* 1. Dynamic Multi-Color Ambient Lighting Canvas */}
      <AmbientBackground
        backdropPath={activeHero?.backdropPath}
        posterPath={activeHero?.posterPath}
        palette={palette}
      />

      {/* Hero Spotlight Section */}
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

      {/* Spacious Main Content Rows (Starting naturally after the Hero Section) */}
      <div className="relative pt-6 sm:pt-10 md:pt-14 z-20 flex flex-col gap-12 sm:gap-16 md:gap-20 max-w-[1750px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Continue Watching (Local Storage) */}
        <ContinueWatchingRow />

        {/* Trending Right Now with Big Ranked Numbers (as in screenshot) */}
        <MediaCarousel
          title="Trending Right Now"
          items={trending}
          showRank={true}
          seeAllHref="/movies"
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* New Movies (as in screenshot) */}
        <MediaCarousel
          title="New Movies"
          items={popularMovies}
          seeAllHref="/movies"
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Popular TV Shows (as in screenshot) */}
        <MediaCarousel
          title="Popular TV Shows"
          items={popularTV}
          seeAllHref="/tv"
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Top Rated Cinema */}
        <MediaCarousel
          title="Critically Acclaimed"
          icon={Star}
          items={topRatedMovies}
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Trending Anime Hub */}
        <MediaCarousel
          title="Trending Anime"
          icon={Sparkles}
          items={animeList}
          seeAllHref="/anime"
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Popular K-Dramas Hub */}
        <MediaCarousel
          title="Popular K-Dramas"
          icon={Heart}
          items={kdramaList}
          seeAllHref="/kdrama"
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Action & Adventure */}
        <MediaCarousel
          title="Action Blockbusters"
          icon={Swords}
          items={actionMovies}
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Sci-Fi & Cyberpunk */}
        <MediaCarousel
          title="Sci-Fi & Future Worlds"
          icon={Sparkles}
          items={sciFiMovies}
          isLoading={isLoading}
          fullWidth={true}
        />
      </div>
    </div>
  );
}


