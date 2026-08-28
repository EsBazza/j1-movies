'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Star,
  Clock,
  Calendar,
  Film,
  Tv,
  Youtube,
  Share2,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getTVSeason,
  getBackdropUrl,
  getPosterUrl,
  getImageUrl,
  normalizeMediaItem,
} from '@/lib/tmdb';
import {
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBSeason,
  TMDBEpisode,
  MediaType,
} from '@/types/tmdb';
import { formatRuntime, formatYear, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { CastList } from '@/components/media/CastList';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';

export default function MediaDetailsPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const type = resolvedParams.type as MediaType;
  const id = resolvedParams.id;

  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Main Media Details
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (type === 'movie') {
          const res = await getMovieDetails(id);
          setDetails(res);
        } else {
          const res = await getTVDetails(id);
          setDetails(res);
          // Default to season 1 if available
          const firstSeason = res.seasons?.find((s) => s.season_number > 0) || res.seasons?.[0];
          if (firstSeason) {
            setSelectedSeasonNum(firstSeason.season_number);
          }
        }
      } catch (err) {
        console.error('Failed to load media details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [type, id]);

  // Load Season Episodes when selectedSeasonNum changes (for TV)
  useEffect(() => {
    if (type !== 'tv' || !id) return;

    async function loadSeasonEpisodes() {
      setIsSeasonLoading(true);
      try {
        const season = await getTVSeason(id, selectedSeasonNum);
        setSeasonData(season);
      } catch (err) {
        console.error('Failed to load season:', err);
      } finally {
        setIsSeasonLoading(false);
      }
    }

    loadSeasonEpisodes();
  }, [type, id, selectedSeasonNum]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20">
        <SkeletonBanner />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Title Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          The movie or TV series you requested could not be retrieved from TMDB.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const title = details.title || details.name || details.original_title || 'Untitled';
  const releaseDate = details.release_date || details.first_air_date || '';
  const runtime = (details as TMDBMovieDetails).runtime;
  const seasons = (details as TMDBTVDetails).seasons?.filter((s) => s.season_number > 0) || [];
  
  // Find official trailer if available
  const trailer = details.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const recommendations = [
    ...(details.recommendations?.results || []),
    ...(details.similar?.results || []),
  ]
    .slice(0, 12)
    .map((item) => normalizeMediaItem(item, type));

  const playHref =
    type === 'movie'
      ? `/watch/movie/${details.id}`
      : `/watch/tv/${details.id}?season=${selectedSeasonNum}&episode=1`;

  return (
    <div className="w-full flex flex-col pb-20">
      {/* Hero Backdrop Header */}
      <div className="relative w-full min-h-[520px] md:min-h-[620px] overflow-hidden">
        <Image
          src={getBackdropUrl(details.backdrop_path || details.poster_path, 'original')}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />

        {/* Content Inside Backdrop */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pt-32 pb-10 z-10">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Poster Card */}
            <div className="hidden sm:block relative w-48 md:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 bg-zinc-900">
              <Image
                src={getPosterUrl(details.poster_path, 'w500')}
                alt={title}
                fill
                sizes="240px"
                className="object-cover"
              />
            </div>

            {/* Media Metadata Info */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="accent" className="capitalize font-bold">
                  {type === 'movie' ? 'Movie' : 'TV Series'}
                </Badge>
                {details.vote_average > 0 && (
                  <Badge variant="rating" className="flex items-center gap-1 bg-black/60 backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Math.round(details.vote_average * 10) / 10} Rating</span>
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
                {type === 'tv' && (details as TMDBTVDetails).number_of_seasons ? (
                  <Badge variant="outline" className="bg-black/40">
                    <Layers className="w-3 h-3 mr-1" />
                    {(details as TMDBTVDetails).number_of_seasons} Seasons
                  </Badge>
                ) : null}
                <Badge variant="hd">Full HD / 4K</Badge>
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {title}
                </h1>
                {details.tagline && (
                  <p className="text-sm sm:text-base text-zinc-400 italic mt-1 font-light">
                    &quot;{details.tagline}&quot;
                  </p>
                )}
              </div>

              {/* Clickable Genre Pills */}
              {details.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {details.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/genre/${g.id}`}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-red-600 hover:text-white border border-zinc-700/60 hover:border-red-500 text-zinc-300 text-xs font-semibold transition-all shadow-sm hover:scale-105"
                    >
                      {g.name} &rarr;
                    </Link>
                  ))}
                </div>
              )}

              {/* Overview */}
              <p className="text-sm sm:text-base text-zinc-300 max-w-3xl leading-relaxed">
                {details.overview || 'No synopsis provided.'}
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <Link
                  href={playHref}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Stream Now</span>
                </Link>

                {trailer && (
                  <button
                    onClick={() => setIsTrailerOpen(true)}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm border border-zinc-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span>Watch Trailer</span>
                  </button>
                )}

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
          </div>
        </div>
      </div>

      {/* Main Section Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 flex flex-col gap-12">
        {/* Cast & Crew */}
        {details.credits?.cast && <CastList cast={details.credits.cast} />}

        {/* TV Series Seasons & Episodes Navigator */}
        {type === 'tv' && seasons.length > 0 && (
          <div className="w-full flex flex-col gap-6 pt-4 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Episodes & Seasons</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Select a season and episode to play instantly.
                </p>
              </div>

              {/* Season Select Dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedSeasonNum}
                  onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                  className="appearance-none bg-zinc-900 border border-zinc-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 pr-10 focus:outline-none focus:border-red-500 cursor-pointer shadow-lg"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      Season {s.season_number} ({s.episode_count} Episodes)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Episodes Grid */}
            {isSeasonLoading ? (
              <div className="py-12 text-center text-zinc-400 text-sm">
                Loading season {selectedSeasonNum} episodes...
              </div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {seasonData.episodes.map((ep: TMDBEpisode) => (
                  <Link
                    key={ep.id}
                    href={`/watch/tv/${details.id}?season=${selectedSeasonNum}&episode=${ep.episode_number}`}
                    className="group flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all p-3"
                  >
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 mb-3">
                      <Image
                        src={getImageUrl(ep.still_path || details.backdrop_path, 'w500')}
                        alt={ep.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[11px] font-bold text-white">
                        EP {ep.episode_number}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="font-semibold text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
                        {ep.episode_number}. {ep.name}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ep.overview || 'No episode summary available.'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No episode list found for this season.
              </div>
            )}
          </div>
        )}

        {/* Recommended & Similar Titles */}
        {recommendations.length > 0 && (
          <div className="pt-4 border-t border-zinc-800/80">
            <MediaCarousel
              title="You May Also Like"
              icon={Sparkles}
              items={recommendations}
            />
          </div>
        )}
      </div>

      {/* Trailer Video Modal */}
      {trailer && (
        <Modal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          title={`${title} - Official Trailer`}
        >
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title="YouTube trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
