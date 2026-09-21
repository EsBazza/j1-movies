'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  Star,
  Film,
  Play,
  Tv,
  Heart,
} from 'lucide-react';
import {
  getTrendingKDrama,
  getTopRatedKDrama,
  getPopularKDrama,
  getKDramaMovies,
  normalizeMediaItem,
  getBackdropUrl,
} from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

export default function KDramaHubPage() {
  const [featured, setFeatured] = useState<NormalizedMedia | null>(null);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [topRated, setTopRated] = useState<NormalizedMedia[]>([]);
  const [popular, setPopular] = useState<NormalizedMedia[]>([]);
  const [movies, setMovies] = useState<NormalizedMedia[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'series' | 'movies'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadKDramaData() {
      setIsLoading(true);
      try {
        const [trendingRes, topRatedRes, popularRes, moviesRes] = await Promise.all([
          getTrendingKDrama(1),
          getTopRatedKDrama(1),
          getPopularKDrama(1),
          getKDramaMovies(1),
        ]);

        const normTrending = (trendingRes.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normTopRated = (topRatedRes.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normPopular = (popularRes.results || []).map((i) => normalizeMediaItem(i, 'tv'));
        const normMovies = (moviesRes.results || []).map((i) => normalizeMediaItem(i, 'movie'));

        setTrending(normTrending);
        setTopRated(normTopRated);
        setPopular(normPopular);
        setMovies(normMovies);

        if (normTrending.length > 0) {
          setFeatured(normTrending[0]);
        }
      } catch (err) {
        console.error('Failed to load K-Drama hub data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadKDramaData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1014] text-white pt-20 pb-28">
      {/* 1. Cinematic Hero Spotlight */}
      {featured && (
        <section className="relative w-full h-[65vh] min-h-[480px] max-h-[640px] overflow-hidden mb-12">
          {featured.backdropPath && (
            <div className="absolute inset-0">
              <Image
                src={getBackdropUrl(featured.backdropPath, 'original')}
                alt={featured.title}
                fill
                priority
                className="object-cover object-top opacity-50 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/40 to-transparent" />
            </div>
          )}

          <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end px-6 sm:px-10 pb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded bg-red-600/90 text-white text-[11px] font-bold tracking-wider uppercase">
                K-Drama Spotlight
              </span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-white text-[11px] font-bold tracking-wider uppercase">
                Korean Audio & Subtitles
              </span>
              {featured.rating > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {featured.rating.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-wide text-white leading-tight max-w-3xl drop-shadow-2xl">
              {featured.title}
            </h1>

            {featured.overview && (
              <p className="text-zinc-300 text-sm sm:text-base line-clamp-2 max-w-2xl mt-3 font-normal leading-relaxed">
                {featured.overview}
              </p>
            )}

            <div className="flex items-center gap-3 mt-6">
              <Link
                href={`/watch/${featured.type}/${featured.id}`}
                className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold tracking-wide transition-all shadow-[0_4px_24px_rgba(229,9,20,0.45)] hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Now</span>
              </Link>
              <Link
                href={`/details/${featured.type}/${featured.id}`}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-xl border border-white/15 transition-all hover:scale-105 active:scale-95"
              >
                More Info
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Sub-Navigation Filter Tabs */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              All K-Dramas
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'series'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Series
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'movies'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Movies
            </button>
          </div>

          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
            Korean Drama & Cinema
          </span>
        </div>
      </div>

      {/* 3. Media Shelves */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Shelf 1: Trending K-Dramas with Ranked Numbers */}
            {(activeTab === 'all' || activeTab === 'series') && (
              <MediaCarousel
                title="Trending K-Dramas"
                items={trending}
                showRank={true}
                isLoading={isLoading}
                fullWidth={true}
              />
            )}

            {/* Shelf 2: Top Rated Korean Series */}
            {(activeTab === 'all' || activeTab === 'series') && (
              <MediaCarousel
                title="Top Rated Series"
                items={topRated}
                isLoading={isLoading}
                fullWidth={true}
              />
            )}

            {/* Shelf 3: Korean Cinema Hits */}
            {(activeTab === 'all' || activeTab === 'movies') && (
              <MediaCarousel
                title="Korean Cinema Hits"
                items={movies}
                isLoading={isLoading}
                fullWidth={true}
              />
            )}

            {/* Shelf 4: Binge-Worthy Favorites */}
            {(activeTab === 'all' || activeTab === 'series') && (
              <MediaCarousel
                title="Binge-Worthy Favorites"
                items={popular}
                isLoading={isLoading}
                fullWidth={true}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
