'use client';

import React, { useEffect, useState } from 'react';
import { Flame, Star, Film, Tv, Sparkles, Swords, Compass } from 'lucide-react';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getPopularTV,
  getTopRatedTV,
  getMoviesByGenre,
  normalizeMediaItem,
} from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { HeroBanner } from '@/components/media/HeroBanner';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { ContinueWatchingRow } from '@/components/media/ContinueWatchingRow';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { ApiKeyWarning } from '@/components/common/ApiKeyWarning';

export default function HomePage() {
  const [heroItem, setHeroItem] = useState<NormalizedMedia | null>(null);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<NormalizedMedia[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<NormalizedMedia[]>([]);
  const [popularTV, setPopularTV] = useState<NormalizedMedia[]>([]);
  const [actionMovies, setActionMovies] = useState<NormalizedMedia[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<NormalizedMedia[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

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
        ] = await Promise.all([
          getTrending('all', 'day').catch(() => null),
          getPopularMovies(1).catch(() => null),
          getTopRatedMovies(1).catch(() => null),
          getPopularTV(1).catch(() => null),
          getMoviesByGenre(28, 1).catch(() => null), // 28: Action
          getMoviesByGenre(878, 1).catch(() => null), // 878: Sci-Fi
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

        setTrending(normalizedTrending);
        setPopularMovies(normalizedPopMovies);
        setTopRatedMovies(normalizedTopMovies);
        setPopularTV(normalizedPopTV);
        setActionMovies(normalizedAction);
        setSciFiMovies(normalizedSciFi);

        // Pick top featured item for hero banner
        if (normalizedTrending.length > 0) {
          setHeroItem(normalizedTrending[0]);
        } else if (normalizedPopMovies.length > 0) {
          setHeroItem(normalizedPopMovies[0]);
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

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Hero Spotlight Section */}
      {isLoading ? (
        <SkeletonBanner />
      ) : heroItem ? (
        <HeroBanner item={heroItem} />
      ) : null}

      {/* Main Content Rows */}
      <div className="relative -mt-8 sm:-mt-12 z-20 flex flex-col gap-6 md:gap-8">
        {/* Continue Watching (Local Storage) */}
        <ContinueWatchingRow />

        {/* Trending Today */}
        <MediaCarousel
          title="Trending Today"
          icon={Flame}
          items={trending}
          isLoading={isLoading}
        />

        {/* Popular Movies */}
        <MediaCarousel
          title="Popular Movies"
          icon={Film}
          items={popularMovies}
          seeAllHref="/movies"
          isLoading={isLoading}
        />

        {/* Popular TV Shows */}
        <MediaCarousel
          title="Binge-worthy TV Series"
          icon={Tv}
          items={popularTV}
          seeAllHref="/tv"
          isLoading={isLoading}
        />

        {/* Top Rated Cinema */}
        <MediaCarousel
          title="Critically Acclaimed"
          icon={Star}
          items={topRatedMovies}
          isLoading={isLoading}
        />

        {/* Action & Adventure */}
        <MediaCarousel
          title="Action Blockbusters"
          icon={Swords}
          items={actionMovies}
          isLoading={isLoading}
        />

        {/* Sci-Fi & Cyberpunk */}
        <MediaCarousel
          title="Sci-Fi & Future Worlds"
          icon={Sparkles}
          items={sciFiMovies}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
