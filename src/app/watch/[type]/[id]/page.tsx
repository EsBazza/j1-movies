'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Film,
  Tv,
  ArrowLeft,
  Bookmark,
  Sparkles,
  Layers,
  Info,
  Calendar,
  Clock,
  Share2,
} from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getBackdropUrl,
  getPosterUrl,
  normalizeMediaItem,
} from '@/lib/tmdb';
import { TMDBMovieDetails, TMDBTVDetails, MediaType } from '@/types/tmdb';
import { UnifiedCinemaPlayer } from '@/components/player/UnifiedCinemaPlayer';
import { EpisodeDrawer } from '@/components/player/EpisodeDrawer';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { CastList } from '@/components/media/CastList';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { Badge } from '@/components/ui/Badge';
import { useUserStore } from '@/lib/store';
import { formatRuntime, formatYear, cn } from '@/lib/utils';

function WatchContent() {
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const type = ((routeParams?.type as string) || 'movie') as MediaType;
  const id = (routeParams?.id as string) || '';

  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  const season = seasonParam ? parseInt(seasonParam, 10) : 1;
  const episode = episodeParam ? parseInt(episodeParam, 10) : 1;

  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const { saveProgress } = useUserStore();

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      try {
        if (type === 'movie') {
          const res = await getMovieDetails(id);
          setDetails(res);

          // Save to LocalStorage History
          saveProgress({
            id: res.id,
            type: 'movie',
            title: res.title || 'Untitled Movie',
            poster_path: res.poster_path,
            backdrop_path: res.backdrop_path,
            vote_average: res.vote_average,
            release_date: res.release_date,
          });
        } else {
          const res = await getTVDetails(id);
          setDetails(res);

          // Save to LocalStorage History
          saveProgress({
            id: res.id,
            type: 'tv',
            title: res.name || 'Untitled TV Series',
            poster_path: res.poster_path,
            backdrop_path: res.backdrop_path,
            vote_average: res.vote_average,
            release_date: res.first_air_date,
            season,
            episode,
          });
        }
      } catch (err) {
        console.error('Failed to load media details for player:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [type, id, season, episode, saveProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-center px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-red-600/30 border-t-red-600 animate-spin mb-4" />
        </div>
        <p className="text-base font-bold text-white tracking-wide">Configuring Cinema Stream...</p>
        <p className="text-xs text-zinc-400 mt-1">Connecting to TMDB & Videasy cluster</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Stream Not Available</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Could not find metadata for this title.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
        >
          Back to Browse
        </Link>
      </div>
    );
  }

  const title = details.title || details.name || 'Untitled';
  const releaseDate = details.release_date || details.first_air_date || '';
  const runtime = (details as TMDBMovieDetails).runtime;
  const recommendations = (details.recommendations?.results || details.similar?.results || [])
    .slice(0, 12)
    .map((m) => normalizeMediaItem(m, type));

  return (
    <div className="w-full min-h-screen pb-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <Image
          src={getBackdropUrl(details.backdrop_path || details.poster_path, 'w1280')}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover filter blur-3xl"
        />
        <div className="absolute inset-0 bg-zinc-950/85" />
      </div>

      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 flex flex-col gap-6 transition-all duration-500',
          isTheaterMode ? 'max-w-[96vw]' : 'max-w-7xl'
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-2">
          <Link
            href={`/details/${type}/${id}`}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-800 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            <span>Details & Trailers</span>
          </Link>

          <div className="flex items-center gap-3">
            <BookmarkButton
              item={{
                id: details.id,
                type,
                title,
                poster_path: details.poster_path,
                backdrop_path: details.backdrop_path,
                vote_average: details.vote_average,
                release_date: releaseDate,
              }}
              variant="button"
            />
          </div>
        </div>

        {/* Video Player & Episode Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Player */}
          <div
            className={cn(
              'flex flex-col gap-5 transition-all duration-300',
              isTheaterMode
                ? 'lg:col-span-12'
                : type === 'tv'
                ? 'lg:col-span-8'
                : 'lg:col-span-12'
            )}
          >
            <UnifiedCinemaPlayer
              type={type}
              tmdbId={details.id}
              season={season}
              episode={episode}
              title={title}
              backdropPath={details.backdrop_path}
              isTheaterMode={isTheaterMode}
              onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
            />

            {/* Title & Metadata Card below player */}
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="accent" className="capitalize font-bold">
                  {type === 'movie' ? 'Movie' : `Season ${season} • Episode ${episode}`}
                </Badge>
                {details.vote_average > 0 && (
                  <Badge variant="rating" className="flex items-center gap-1 bg-black/60 backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Math.round(details.vote_average * 10) / 10} TMDB Score</span>
                  </Badge>
                )}
                {releaseDate && (
                  <Badge variant="outline" className="bg-black/40">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatYear(releaseDate)}
                  </Badge>
                )}
                {runtime ? (
                  <Badge variant="outline" className="bg-black/40">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatRuntime(runtime)}
                  </Badge>
                ) : null}
                <Badge variant="hd">Full HD 1080p</Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {title}
              </h1>

              {details.overview && (
                <p className="text-sm text-zinc-300 leading-relaxed max-w-4xl pt-1">
                  {details.overview}
                </p>
              )}

              {details.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {details.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/genre/${g.id}`}
                      className="px-3 py-1 rounded-full bg-zinc-800/90 hover:bg-red-600 hover:text-white text-zinc-300 text-xs font-semibold border border-zinc-700/60 hover:border-red-500 transition-all hover:scale-105"
                    >
                      {g.name} &rarr;
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TV Episodes Drawer Sidebar */}
          {type === 'tv' && (
            <div
              className={cn(
                'w-full transition-all duration-300',
                isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-4'
              )}
            >
              <EpisodeDrawer
                tvId={details.id}
                tvDetails={details as TMDBTVDetails}
                currentSeason={season}
                currentEpisode={episode}
              />
            </div>
          )}
        </div>

        {/* Cast & Crew Carousel */}
        {details.credits?.cast && (
          <div className="pt-8 border-t border-zinc-800/80">
            <CastList cast={details.credits.cast} />
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-6 border-t border-zinc-800/80">
            <MediaCarousel
              title="More Like This"
              icon={Sparkles}
              items={recommendations}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-zinc-400">Loading Cinema Stream...</div>}>
      <WatchContent />
    </Suspense>
  );
}
