'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, History, Trash2 } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { getBackdropUrl } from '@/lib/tmdb';
import { formatRelativeTime } from '@/lib/utils';

export function ContinueWatchingRow() {
  const { history, removeFromHistory, hasHydrated } = useUserStore();

  if (!hasHydrated || history.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-red-500" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Continue Watching
          </h2>
        </div>
        <Link
          href="/watchlist"
          className="text-xs md:text-sm font-semibold text-red-500 hover:text-red-400"
        >
          View All History →
        </Link>
      </div>

      <div className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2">
        {history.slice(0, 10).map((item) => {
          const playUrl =
            item.type === 'tv' && item.season && item.episode
              ? `/watch/tv/${item.id}?season=${item.season}&episode=${item.episode}`
              : `/watch/${item.type}/${item.id}`;

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="group relative w-[240px] sm:w-[280px] flex-shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 shadow-md"
            >
              {/* 16:9 Backdrop Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                <Image
                  src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 240px, 280px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />

                {/* Play Button Overlay */}
                <Link
                  href={playUrl}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromHistory(item.id, item.type);
                  }}
                  title="Remove from history"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-zinc-400 hover:text-red-400 hover:bg-black/90 transition-colors z-10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details */}
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-zinc-100 truncate">{item.title}</h3>
                  <span className="text-[10px] text-zinc-500 flex-shrink-0">
                    {formatRelativeTime(item.lastWatchedAt)}
                  </span>
                </div>
                {item.type === 'tv' && item.season && item.episode ? (
                  <p className="text-xs text-red-400 font-medium mt-0.5">
                    S{item.season}:E{item.episode} {item.episodeTitle ? `• ${item.episodeTitle}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 mt-0.5 capitalize">{item.type}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
