'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { TMDBSeason, WatchHistoryItem } from '@/types/tmdb';
import { getImageUrl, getTVSeason } from '@/lib/tmdb';
import { Chip } from '@/components/ui/Chip';
import { formatDateFull, cn } from '@/lib/utils';

interface EpisodesPanelProps {
  tvId: number;
  seasons: TMDBSeason[];
  fallbackStill: string | null;
  historyItem?: WatchHistoryItem;
}

export function EpisodesPanel({ tvId, seasons, fallbackStill, historyItem }: EpisodesPanelProps) {
  const [selected, setSelected] = useState<number>(historyItem?.season ?? seasons[0]?.season_number ?? 1);
  const [data, setData] = useState<{ season: number; value: TMDBSeason | null } | null>(null);

  useEffect(() => {
    let ignore = false;
    getTVSeason(tvId, selected)
      .then((res) => !ignore && setData({ season: selected, value: res }))
      .catch(() => !ignore && setData({ season: selected, value: null }));
    return () => {
      ignore = true;
    };
  }, [tvId, selected]);

  const isLoading = data?.season !== selected;
  const episodes = !isLoading ? data?.value?.episodes ?? [] : [];

  return (
    <div className="flex flex-col gap-5">
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Season">
          {seasons.map((s) => (
            <Chip key={s.id} selected={selected === s.season_number} onClick={() => setSelected(s.season_number)}>
              Season {s.season_number}
            </Chip>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6" role="status" aria-label="Loading episodes">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-card bg-surface-2" />
              <div className="h-4 w-2/3 rounded bg-surface-2 mt-3" />
              <div className="h-3 w-full rounded bg-surface-1 mt-2" />
            </div>
          ))}
        </div>
      ) : episodes.length > 0 ? (
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {episodes.map((ep) => {
            const isLast = historyItem?.season === selected && historyItem.episode === ep.episode_number;
            const progress = isLast && !historyItem?.finished ? historyItem?.progressPercent : undefined;
            return (
              <li key={ep.id}>
                <Link href={`/watch/tv/${tvId}?season=${selected}&episode=${ep.episode_number}`} className="group block">
                  <div className="relative aspect-video rounded-card overflow-hidden bg-surface-2">
                    <Image
                      src={getImageUrl(ep.still_path || fallbackStill, 'w500')}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="w-11 h-11 rounded-full bg-white/90 text-black flex items-center justify-center">
                        <Play className="w-5 h-5 fill-black ml-0.5" aria-hidden="true" />
                      </span>
                    </span>
                    {isLast && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-on-accent text-[11px] font-semibold">
                        {historyItem?.finished ? 'Watched' : 'Last watched'}
                      </span>
                    )}
                    {progress ? (
                      <span className="absolute bottom-0 inset-x-0 h-1 bg-white/20" aria-hidden="true">
                        <span className="block h-full bg-accent" style={{ width: `${progress}%` }} />
                      </span>
                    ) : null}
                  </div>
                  <h3 className={cn('mt-3 text-sm font-semibold font-sans tracking-normal', isLast ? 'text-white' : 'text-zinc-200 group-hover:text-white')}>
                    {ep.episode_number}. {ep.name}
                  </h3>
                  <p className="text-xs text-subtle mt-0.5">
                    {[ep.runtime ? `${ep.runtime}m` : '', ep.air_date ? formatDateFull(ep.air_date) : ''].filter(Boolean).join(' · ')}
                  </p>
                  {ep.overview && <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">{ep.overview}</p>}
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="py-10 text-sm text-muted">No episodes listed for this season yet.</p>
      )}
    </div>
  );
}
