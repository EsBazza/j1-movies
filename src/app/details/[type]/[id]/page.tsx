'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Star,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Plus,
  Check,
  Film,
  Tv,
  Youtube,
  Layers,
  Sparkles,
  ChevronDown,
  Building2,
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
  TMDBVideo,
  MediaType,
} from '@/types/tmdb';
import { formatRuntime, formatYear, formatEndTime, formatCurrency, formatDateFull, cn } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { CastList } from '@/components/media/CastList';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';

export default function MediaDetailsPage() {
  const routeParams = useParams();
  const type = ((routeParams?.type as string) || 'movie') as MediaType;
  const id = (routeParams?.id as string) || '';

  const [details, setDetails] = useState<TMDBMovieDetails | TMDBTVDetails | null>(null);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [selectedModalVideo, setSelectedModalVideo] = useState<TMDBVideo | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load Main Media Details
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      try {
        if (type === 'movie') {
          const res = await getMovieDetails(id);
          setDetails(res);
        } else {
          const res = await getTVDetails(id);
          setDetails(res);
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
      <div className="min-h-screen pt-24 max-w-7xl mx-auto px-4">
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
  
  // Find Director from crew
  const director = details.credits?.crew?.find((c) => c.job === 'Director' || c.department === 'Directing');

  // YouTube Videos (Trailers, Teasers, Clips)
  const allVideos = (details.videos?.results || []).filter((v) => v.site === 'YouTube');
  const mainTrailer =
    allVideos.find((v) => v.type === 'Trailer') ||
    allVideos.find((v) => v.type === 'Teaser') ||
    allVideos[0];

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

  const budget = (details as TMDBMovieDetails).budget;
  const revenue = (details as TMDBMovieDetails).revenue;
  const companies = details.production_companies || [];

  return (
    <div className="w-full flex flex-col min-h-screen relative overflow-hidden bg-[#07090e]">
      {/* 1. Dynamic Ambient Color Halo Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {details.backdrop_path && (
          <Image
            src={getBackdropUrl(details.backdrop_path, 'w1280')}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover filter blur-[100px] opacity-35 scale-125"
          />
        )}
        <div className="absolute inset-0 bg-[#07090e]/75" />
      </div>

      {/* 2. Hero Section with Background Video Trailer (CineJoy Style) */}
      <div className="relative w-full min-h-[580px] lg:min-h-[720px] overflow-hidden flex flex-col justify-end">
        {/* Background Video Trailer Layer */}
        {mainTrailer ? (
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none -z-0">
            <iframe
              key={`bg-trailer-${mainTrailer.key}-${isMuted ? 'muted' : 'unmuted'}`}
              src={`https://www.youtube-nocookie.com/embed/${mainTrailer.key}?autoplay=1&mute=${
                isMuted ? 1 : 0
              }&loop=1&playlist=${mainTrailer.key}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
              title="Ambient trailer background"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vw] h-[160vh] min-w-full min-h-full object-cover scale-125 opacity-70 filter brightness-60"
            />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full pointer-events-none -z-0">
            <Image
              src={getBackdropUrl(details.backdrop_path || details.poster_path, 'original')}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top filter brightness-50"
            />
          </div>
        )}

        {/* Cinematic Vignette Gradients for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/50 to-transparent pointer-events-none z-10" />

        {/* Hero Content Overlay (Left Info + Right Stats) */}
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-12 z-20 flex flex-col lg:flex-row items-end justify-between gap-8">
          {/* Left Column: Title, Genres, Actions, Synopsis */}
          <div className="flex-1 flex flex-col gap-4 max-w-3xl">
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>

            {/* Bulleted Genre List */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-300 flex-wrap">
                {details.genres.map((genre, idx) => (
                  <React.Fragment key={genre.id}>
                    <Link
                      href={`/genre/${genre.id}`}
                      className="hover:text-white transition-colors"
                    >
                      {genre.name}
                    </Link>
                    {idx < details.genres.length - 1 && (
                      <span className="text-zinc-600 font-bold">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Action Bar (White Capsule Play, Add to List, Audio Toggle) */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {/* White Capsule ▶ Play Button */}
              <Link
                href={playHref}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play</span>
              </Link>

              {/* Bookmark Button */}
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
                variant="icon"
              />

              {/* Background Trailer Audio Toggle */}
              {mainTrailer && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute Trailer Audio' : 'Mute Trailer Audio'}
                  className="w-12 h-12 rounded-full bg-black/50 hover:bg-zinc-800 text-white backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-xl"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-red-500 animate-pulse" />}
                </button>
              )}
            </div>

            {/* Meta Tags Row: Year, Runtime, Content Rating, TMDB Rating */}
            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300 pt-1 flex-wrap">
              {releaseDate && <span>{formatYear(releaseDate)}</span>}
              {runtime ? (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{formatRuntime(runtime)}</span>
                </>
              ) : null}
              <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-[11px] font-bold text-zinc-200 border border-white/10">
                {type === 'movie' ? 'PG-13' : 'TV-MA'}
              </span>
              {details.vote_average > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{Math.round(details.vote_average * 10) / 10}</span>
                  </span>
                </>
              )}
            </div>

            {/* Director Byline */}
            {director && (
              <div className="text-xs text-zinc-400">
                <span>Director: </span>
                <span className="text-zinc-200 font-semibold">{director.name}</span>
              </div>
            )}

            {/* Synopsis with Read More Toggle */}
            {details.overview && (
              <div className="flex flex-col gap-1 pt-1">
                <p
                  className={cn(
                    'text-xs sm:text-sm text-zinc-300 leading-relaxed transition-all',
                    !isBioExpanded && 'line-clamp-3'
                  )}
                >
                  {details.overview}
                </p>
                {details.overview.length > 220 && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-xs font-bold text-zinc-400 hover:text-white self-start transition-colors cursor-pointer"
                  >
                    {isBioExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Cinema Stats Card (CineJoy Style) */}
          <div className="w-full lg:w-72 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 p-5 flex flex-col gap-3 shadow-2xl">
            {runtime ? (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                <span className="text-zinc-400">Runtime</span>
                <span className="text-zinc-100 font-semibold text-right">{formatEndTime(runtime)}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
              <span className="text-zinc-400">Language</span>
              <span className="text-zinc-100 font-bold uppercase">{details.original_language || 'EN'}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
              <span className="text-zinc-400">Release Date</span>
              <span className="text-zinc-100 font-semibold">{formatDateFull(releaseDate)}</span>
            </div>

            {type === 'movie' && (
              <>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Budget</span>
                  <span className="text-zinc-100 font-semibold">{formatCurrency(budget)}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Revenue</span>
                  <span className="text-zinc-100 font-semibold">{formatCurrency(revenue)}</span>
                </div>
              </>
            )}

            {/* Production Studios */}
            {companies.length > 0 && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {companies.slice(0, 3).map((comp) => (
                  <span
                    key={comp.id}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-900/80 border border-white/10 text-zinc-300 font-medium"
                  >
                    {comp.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Body Content Sections */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 z-20">
        {/* Cast Showcase (Circular Avatars) */}
        {details.credits?.cast && <CastList cast={details.credits.cast} />}

        {/* TV Series Seasons & Episodes Navigator */}
        {type === 'tv' && seasons.length > 0 && (
          <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-500" />
                  <span>Episodes & Seasons</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Select a season and episode to stream.
                </p>
              </div>

              {/* Season Select Dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedSeasonNum}
                  onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                  className="appearance-none bg-zinc-900/80 border border-white/10 text-white text-xs font-semibold rounded-xl px-4 py-2.5 pr-9 focus:outline-none focus:border-red-500 cursor-pointer shadow-lg backdrop-blur-xl"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      Season {s.season_number} ({s.episode_count} Episodes)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
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
                    className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/10 hover:border-white/25 hover:bg-zinc-900/70 transition-all p-3"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 mb-3">
                      <Image
                        src={getImageUrl(ep.still_path || details.backdrop_path, 'w500')}
                        alt={ep.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-extrabold text-white">
                        EP {ep.episode_number}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-white transition-colors">
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

        {/* 4. "Trailers & Clips" Multi-Video Gallery (Screenshot 2 Style) */}
        {allVideos.length > 0 && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trailers</h3>
              <span className="text-xs text-zinc-500">{allVideos.length} Videos Available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allVideos.slice(0, 8).map((vid) => (
                <button
                  key={vid.id}
                  onClick={() => setSelectedModalVideo(vid)}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/10 hover:border-white/25 hover:bg-zinc-900/70 transition-all text-left cursor-pointer p-2.5 shadow-xl"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-2.5">
                    <Image
                      src={`https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`}
                      alt={vid.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white uppercase">
                      {vid.type}
                    </div>
                  </div>

                  <span className="font-bold text-xs text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
                    {vid.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">{vid.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. "You Might Also Like" Recommendation Carousel */}
        {recommendations.length > 0 && (
          <div className="pt-2">
            <MediaCarousel
              title="You Might Also Like"
              icon={Sparkles}
              items={recommendations}
            />
          </div>
        )}
      </div>

      {/* Video Popup Modal */}
      {selectedModalVideo && (
        <Modal
          isOpen={Boolean(selectedModalVideo)}
          onClose={() => setSelectedModalVideo(null)}
          title={selectedModalVideo.name}
        >
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${selectedModalVideo.key}?autoplay=1&rel=0`}
              title={selectedModalVideo.name}
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
