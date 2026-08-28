'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, History, Trash2, Play, Film, Tv, Sparkles } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';
import { formatRelativeTime, formatYear, cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/MediaCard';

export default function WatchlistPage() {
  const { watchlist, history, clearHistory, removeFromHistory, removeFromWatchlist, hasHydrated } =
    useUserStore();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'history'>('watchlist');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredWatchlist = watchlist.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const filteredHistory = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Library</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Stored locally in your browser with zero logins required.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'watchlist'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist ({hasHydrated ? watchlist.length : 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'history'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <History className="w-4 h-4" />
            <span>History ({hasHydrated ? history.length : 0})</span>
          </button>
        </div>
      </div>

      {/* Sub-bar Filter & Actions */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
              filterType === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
              filterType === 'movie'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            Movies
          </button>
          <button
            onClick={() => setFilterType('tv')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
              filterType === 'tv'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            TV Series
          </button>
        </div>

        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear your entire watch history?')) {
                clearHistory();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Watchlist Tab Content */}
      {activeTab === 'watchlist' && (
        <>
          {filteredWatchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-4">
              {filteredWatchlist.map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative group">
                  <MediaCard
                    item={{
                      id: item.id,
                      type: item.type,
                      title: item.title,
                      overview: '',
                      posterPath: item.poster_path,
                      backdropPath: item.backdrop_path,
                      rating: item.vote_average,
                      releaseDate: item.release_date || '',
                    }}
                  />
                  <button
                    onClick={() => removeFromWatchlist(item.id, item.type)}
                    title="Remove from watchlist"
                    className="absolute top-2.5 right-2.5 z-20 p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Your Watchlist is empty</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                Explore movies and series, and click the bookmark icon to save titles here for later.
              </p>
              <Link
                href="/movies"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Movies</span>
              </Link>
            </div>
          )}
        </>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <>
          {filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              {filteredHistory.map((item) => {
                const playUrl =
                  item.type === 'tv' && item.season && item.episode
                    ? `/watch/tv/${item.id}?season=${item.season}&episode=${item.episode}`
                    : `/watch/${item.type}/${item.id}`;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-md flex flex-col"
                  >
                    {/* Backdrop */}
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                      <Image
                        src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />

                      <Link
                        href={playUrl}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </Link>

                      <button
                        onClick={() => removeFromHistory(item.id, item.type)}
                        title="Remove from history"
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-zinc-400 hover:text-red-400 hover:bg-black/90 transition-colors z-10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm text-zinc-100 truncate">
                            {item.title}
                          </h3>
                        </div>
                        {item.type === 'tv' && item.season && item.episode ? (
                          <p className="text-xs text-red-400 font-medium mt-1">
                            Season {item.season}, Episode {item.episode}{' '}
                            {item.episodeTitle ? `• ${item.episodeTitle}` : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 mt-1 capitalize">{item.type}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/60 text-xs text-zinc-500">
                        <span>{formatRelativeTime(item.lastWatchedAt)}</span>
                        <Link
                          href={playUrl}
                          className="font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <span>Resume</span>
                          <Play className="w-3 h-3 fill-red-400" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">No watch history yet</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                When you stream movies and episodes, your progress will be saved here automatically.
              </p>
              <Link
                href="/movies"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Watching</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
