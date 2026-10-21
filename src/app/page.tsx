'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { BecauseYouWatched } from '@/components/media/BecauseYouWatched';
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

  const featuredItems = trending.length > 0 ? trending.slice(0, 6) : popularMovies.slice(0, 6);
  const activeHero = heroItem || featuredItems[0];

  return (
    <div className="flex flex-col w-full pb-28 lg:pb-16 min-h-screen">
      <AmbientBackground backdropPath={activeHero?.backdropPath} posterPath={activeHero?.posterPath} palette={palette} />

      {isLoading ? (
        <SkeletonBanner />
      ) : (
        <HeroBanner items={featuredItems} item={activeHero} onActiveItemChange={handleActiveHeroChange} />
      )}

      {/* Rows overlap the hero's faded bottom so the page reads as one surface */}
      <div className="relative z-10 -mt-10 sm:-mt-14 flex flex-col gap-10 sm:gap-14">
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-8 lg:px-12 empty:hidden">
          <ContinueWatchingRow />
        </div>
        <MediaCarousel title="Top 10 today" items={trending.slice(0, 10)} showRank isLoading={isLoading} />
        <BecauseYouWatched />
        <MediaCarousel title="Popular movies" items={popularMovies} seeAllHref="/movies" isLoading={isLoading} />
        <MediaCarousel title="Popular series" items={popularTV} seeAllHref="/tv" isLoading={isLoading} />
        <MediaCarousel title="Trending anime" items={animeList} seeAllHref="/anime" isLoading={isLoading} />
        <MediaCarousel title="Popular K-dramas" items={kdramaList} seeAllHref="/kdrama" isLoading={isLoading} />
        <MediaCarousel title="Critically acclaimed" items={topRatedMovies} isLoading={isLoading} />
        <MediaCarousel title="Action" items={actionMovies} seeAllHref="/genre/28?type=movie" isLoading={isLoading} />
        <MediaCarousel title="Science fiction" items={sciFiMovies} seeAllHref="/genre/878?type=movie" isLoading={isLoading} />
      </div>
    </div>
  );
}
