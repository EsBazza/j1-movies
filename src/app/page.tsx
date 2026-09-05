'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Flame, Star, Film, Tv, Sparkles, Swords } from 'lucide-react';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getPopularTV,
  getMoviesByGenre,
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

export default function HomePage() {
  const [heroItem, setHeroItem] = useState<NormalizedMedia | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<NormalizedMedia[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<NormalizedMedia[]>([]);
  const [popularTV, setPopularTV] = useState<NormalizedMedia[]>([]);
  const [actionMovies, setActionMovies] = useState<NormalizedMedia[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<NormalizedMedia[]>([]);
  
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
      {/* 1. Dynamic Multi-Color Ambient Lighting Canvas (Covers entire screen from Hero through Footer seamlessly) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dynamic High-Diffusion Multi-Color Backdrop Image */}
        {(activeHero?.backdropPath || activeHero?.posterPath) && (
          <div className="absolute -inset-[15%] pointer-events-none overflow-hidden">
            <Image
              src={getBackdropUrl(activeHero.backdropPath || activeHero.posterPath, 'w1280')}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover scale-135 filter blur-[80px] saturate-[280%] brightness-80 opacity-80 transition-all duration-1000"
            />
          </div>
        )}

        {/* Spot 1: Vibrant Primary Color Bloom (Top Left - Behind Title) */}
        <div
          className="absolute -top-[10%] -left-[15%] w-[85vw] h-[900px] rounded-full filter blur-[90px] opacity-95 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.primaryGlow }}
        />

        {/* Spot 2: Vibrant Secondary Color Bloom (Top Right - Behind Hero Stats) */}
        <div
          className="absolute top-[5%] -right-[15%] w-[85vw] h-[900px] rounded-full filter blur-[90px] opacity-90 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.secondaryGlow }}
        />

        {/* Spot 3: Chromatic Tertiary Color Bloom (Mid Body - Behind Continue Watching & Trending) */}
        <div
          className="absolute top-[35%] -left-[20%] w-[90vw] h-[950px] rounded-full filter blur-[100px] opacity-85 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.tertiaryGlow }}
        />

        {/* Spot 4: Atmospheric Quaternary Color Bloom (Lower Body & Footer) */}
        <div
          className="absolute top-[60%] -right-[20%] w-[95vw] h-[1000px] rounded-full filter blur-[110px] opacity-85 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.quaternaryGlow }}
        />

        {/* Spot 5: Central Chromatic Mixing Orb */}
        <div
          className="absolute top-[20%] left-[20%] w-[60vw] h-[600px] rounded-full filter blur-[90px] opacity-80 transition-all duration-1000 mix-blend-screen"
          style={{ backgroundColor: palette.primaryGlow }}
        />

        {/* Multi-Point Chromatic Radial Mesh Lighting */}
        <div
          className="absolute inset-0 opacity-75 transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse 90% 70% at 15% 20%, ${palette.primaryGlow}, transparent 60%), radial-gradient(ellipse 90% 70% at 85% 30%, ${palette.secondaryGlow}, transparent 60%), radial-gradient(ellipse 90% 70% at 20% 65%, ${palette.tertiaryGlow}, transparent 60%), radial-gradient(ellipse 100% 70% at 80% 85%, ${palette.quaternaryGlow}, transparent 60%)`,
          }}
        />

        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-[#07090e]/30" />
      </div>

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

        {/* Trending Today */}
        <MediaCarousel
          title="Trending Today"
          icon={Flame}
          items={trending}
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Popular Movies */}
        <MediaCarousel
          title="Popular Movies"
          icon={Film}
          items={popularMovies}
          seeAllHref="/movies"
          isLoading={isLoading}
          fullWidth={true}
        />

        {/* Popular TV Shows */}
        <MediaCarousel
          title="Binge-worthy TV Series"
          icon={Tv}
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


