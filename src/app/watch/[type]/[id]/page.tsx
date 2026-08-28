'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Film, Tv, ArrowLeft, Bookmark, Sparkles, Layers, Info } from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  normalizeMediaItem,
} from '@/lib/tmdb';
import { TMDBMovieDetails, TMDBTVDetails, MediaType } from '@/types/tmdb';
import { VideasyPlayer } from '@/components/player/VideasyPlayer';
import { EpisodeDrawer } from '@/components/player/EpisodeDrawer';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { Badge } from '@/components/ui/Badge';
import { useUserStore } from '@/lib/store';
import { formatYear } from '@/lib/utils';

function WatchContent({
  type,
  id,
}: {
  type: MediaType;
  id: string;
}) {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  const season = seasonParam ? parseInt(seasonParam, 10) : 1;
  const episode = episodeParam ? parseInt(episodeParam, 10) : 1;

  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { saveProgress } = useUserStore();

  useEffect(() => {
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
        <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-300">Setting up your cinema stream...</p>
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
  const recommendations = (details.recommendations?.results || details.similar?.results || [])
    .slice(0, 10)
    .map((m) => normalizeMediaItem(m, type));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-20 flex flex-col gap-8">
      {/* Top Navigation Back Action */}
      <div className="flex items-center justify-between">
        <Link
          href={`/details/${type}/${id}`}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </Link>

        <div className="flex items-center gap-2">
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

      {/* Main Player & TV Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Player Area */}
        <div className={type === 'tv' ? 'lg:col-span-2 flex flex-col gap-4' : 'lg:col-span-3 flex flex-col gap-4'}>
          <VideasyPlayer
            type={type}
            tmdbId={details.id}
            season={season}
            episode={episode}
            title={title}
          />

          {/* Title and Metadata below player */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="accent" className="capitalize">
                {type === 'movie' ? 'Movie' : `Season ${season} • Episode ${episode}`}
              </Badge>
              {details.vote_average > 0 && (
                <Badge variant="rating" className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{Math.round(details.vote_average * 10) / 10}</span>
                </Badge>
              )}
              {releaseDate && <Badge variant="outline">{formatYear(releaseDate)}</Badge>}
              <Badge variant="hd">1080p / 4K</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-4xl">{details.overview}</p>
          </div>
        </div>

        {/* Right TV Episodes Drawer (TV Series Only) */}
        {type === 'tv' && (
          <div className="lg:col-span-1">
            <EpisodeDrawer
              tvId={details.id}
              tvDetails={details as TMDBTVDetails}
              currentSeason={season}
              currentEpisode={episode}
            />
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="pt-8 border-t border-zinc-800">
          <MediaCarousel
            title="More Like This"
            icon={Sparkles}
            items={recommendations}
          />
        </div>
      )}
    </div>
  );
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const type = resolvedParams.type as MediaType;
  const id = resolvedParams.id;

  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-zinc-400">Loading Cinema Player...</div>}>
      <WatchContent type={type} id={id} />
    </Suspense>
  );
}
