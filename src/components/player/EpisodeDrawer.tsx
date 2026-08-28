'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronDown, ListVideo, FastForward, CheckCircle2 } from 'lucide-react';
import { TMDBSeason, TMDBEpisode, TMDBTVDetails } from '@/types/tmdb';
import { getTVSeason, getImageUrl } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

interface EpisodeDrawerProps {
  tvId: number | string;
  tvDetails: TMDBTVDetails;
  currentSeason: number;
  currentEpisode: number;
}

export function EpisodeDrawer({
  tvId,
  tvDetails,
  currentSeason,
  currentEpisode,
}: EpisodeDrawerProps) {
  const seasons = tvDetails.seasons?.filter((s) => s.season_number > 0) || [];
  const [selectedSeason, setSelectedSeason] = useState<number>(currentSeason);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedSeason(currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    async function loadEpisodes() {
      setIsLoading(true);
      try {
        const data = await getTVSeason(tvId, selectedSeason);
        setSeasonData(data);
      } catch (err) {
        console.error('Failed to load season:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEpisodes();
  }, [tvId, selectedSeason]);

  // Compute Next Episode Link
  const currentSeasonEpisodes = seasonData?.episodes || [];
  const hasNextEpisodeInSeason = currentSeasonEpisodes.some(
    (ep) => ep.episode_number === currentEpisode + 1
  );

  const nextEpisodeHref = hasNextEpisodeInSeason
    ? `/watch/tv/${tvId}?season=${currentSeason}&episode=${currentEpisode + 1}`
    : seasons.some((s) => s.season_number === currentSeason + 1)
    ? `/watch/tv/${tvId}?season=${currentSeason + 1}&episode=1`
    : null;

  return (
    <div className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 flex flex-col gap-4 shadow-xl">
      {/* Top Header & Season Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ListVideo className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">Episodes</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Next Episode Quick CTA */}
          {nextEpisodeHref && (
            <Link
              href={nextEpisodeHref}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-md shadow-red-600/20"
            >
              <span>Next Episode</span>
              <FastForward className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Season Dropdown */}
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="appearance-none bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold rounded-lg px-3.5 py-1.5 pr-8 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.season_number}>
                  Season {s.season_number}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Episode Scrollable List */}
      <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-zinc-400">Loading episodes...</div>
        ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
          seasonData.episodes.map((ep: TMDBEpisode) => {
            const isCurrent =
              selectedSeason === currentSeason && ep.episode_number === currentEpisode;

            return (
              <Link
                key={ep.id}
                href={`/watch/tv/${tvId}?season=${selectedSeason}&episode=${ep.episode_number}`}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all group',
                  isCurrent
                    ? 'bg-red-600/10 border border-red-500/40 text-white'
                    : 'bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800/60 text-zinc-300'
                )}
              >
                {/* Episode Thumbnail */}
                <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                  <Image
                    src={getImageUrl(ep.still_path || tvDetails.backdrop_path, 'w300')}
                    alt={ep.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center',
                      isCurrent ? 'bg-black/60' : 'bg-black/30 group-hover:bg-black/50'
                    )}
                  >
                    {isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                        EP {ep.episode_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={cn(
                        'text-xs font-semibold truncate',
                        isCurrent ? 'text-red-400' : 'text-zinc-200 group-hover:text-white'
                      )}
                    >
                      {ep.episode_number}. {ep.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                    {ep.overview || 'No synopsis available.'}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-zinc-500">No episodes found.</div>
        )}
      </div>
    </div>
  );
}
