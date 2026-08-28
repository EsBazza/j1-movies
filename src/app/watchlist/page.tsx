'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bookmark,
  History,
  FolderPlus,
  Folders,
  Download,
  Upload,
  Trash2,
  Play,
  Film,
  Tv,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';
import { formatRelativeTime, formatYear, cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/MediaCard';
import { Modal } from '@/components/ui/Modal';

export default function WatchlistPage() {
  const {
    watchlist,
    history,
    collections,
    createCollection,
    deleteCollection,
    removeItemFromCollection,
    clearHistory,
    removeFromHistory,
    removeFromWatchlist,
    exportDataJSON,
    importDataJSON,
    hasHydrated,
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'history' | 'collections'>('watchlist');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // New Collection Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  // Backup Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExport = () => {
    try {
      const json = exportDataJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `j1-movies-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'Library backup successfully exported!');
    } catch (err) {
      showToast('error', 'Failed to export library backup.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        showToast('success', 'Library backup restored successfully!');
      } else {
        showToast('error', 'Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    createCollection(newCollectionName.trim(), newCollectionDesc.trim() || undefined);
    setNewCollectionName('');
    setNewCollectionDesc('');
    setIsCreateModalOpen(false);
    showToast('success', 'Collection created!');
  };

  const filteredWatchlist = watchlist.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const filteredHistory = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const activeCollection = collections.find((c) => c.id === selectedCollectionId);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={cn(
            'fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-xs font-semibold animate-in slide-in-from-top-4 duration-300',
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
              : 'bg-red-950/90 text-red-300 border-red-500/40 shadow-red-950/40'
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Cinema Library</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Stored locally with zero logins. Export backup anytime.
          </p>
        </div>

        {/* Tab & Backup Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'watchlist'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Watchlist ({hasHydrated ? watchlist.length : 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'history'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({hasHydrated ? history.length : 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'collections'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Folders className="w-3.5 h-3.5" />
              <span>Collections ({hasHydrated ? collections.length : 0})</span>
            </button>
          </div>

          {/* Backup Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Download JSON Backup"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-red-500" />
              <span>Backup</span>
            </button>

            <label
              title="Restore from JSON Backup file"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restore</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Sub-bar Filter & Actions */}
      {activeTab !== 'collections' && (
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
      )}

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

      {/* Custom Collections Tab Content */}
      {activeTab === 'collections' && (
        <div className="mt-6 flex flex-col gap-8">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-white">Custom Watchlist Collections</h2>
              <p className="text-xs text-zinc-400">Organize your movies and shows into tailored categories.</p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>

          {collections.length > 0 ? (
            <div className="flex flex-col gap-8">
              {collections.map((col) => (
                <div key={col.id} className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{col.name}</h3>
                      {col.description && <p className="text-xs text-zinc-400 mt-0.5">{col.description}</p>}
                      <span className="text-[11px] text-zinc-500">{col.items.length} titles</span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${col.name}" collection?`)) {
                          deleteCollection(col.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {col.items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {col.items.map((item) => (
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
                            onClick={() => removeItemFromCollection(col.id, item.id, item.type)}
                            title="Remove from collection"
                            className="absolute top-2.5 right-2.5 z-20 p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      This collection is currently empty.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4">
                <FolderPlus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">No custom collections yet</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                Group movies into folders like &quot;Anime Marathon&quot; or &quot;Date Night Classics&quot;.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Collection</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Collection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Custom Collection"
      >
        <form onSubmit={handleCreateCollection} className="flex flex-col gap-4 p-2">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Collection Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Marvel Marathon, Anime Favorites..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. My favorite weekend movie binges"
              value={newCollectionDesc}
              onChange={(e) => setNewCollectionDesc(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
            >
              Create Collection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
