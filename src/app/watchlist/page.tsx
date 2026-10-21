'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Sparkles,
  Plus,
  X,
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { getBackdropUrl } from '@/lib/tmdb';
import { formatRelativeTime, formatRuntime, cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/MediaCard';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { WatchHistoryItem } from '@/types/tmdb';

type Tab = 'watchlist' | 'history' | 'collections';
const TABS: Tab[] = ['watchlist', 'history', 'collections'];

function WatchlistContent() {
  const {
    watchlist,
    history,
    collections,
    createCollection,
    deleteCollection,
    restoreCollection,
    addItemToCollection,
    removeItemFromCollection,
    clearHistory,
    removeFromHistory,
    restoreHistoryItem,
    exportDataJSON,
    importDataJSON,
  } = useUserStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'watchlist';
  const setActiveTab = (tab: Tab) => router.replace(tab === 'watchlist' ? '/watchlist' : `/watchlist?tab=${tab}`, { scroll: false });
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  // New Collection Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => toast(text, { tone: type === 'success' ? 'success' : 'info' });

  const handleRemoveHistory = (item: WatchHistoryItem) => {
    removeFromHistory(item.id, item.type);
    toast(`Removed "${item.title}"`, { tone: 'info', action: { label: 'Undo', onClick: () => restoreHistoryItem(item) } });
  };

  const handleClearHistory = () => {
    const snapshot = history;
    clearHistory();
    toast('Watch history cleared', {
      tone: 'info',
      action: { label: 'Undo', onClick: () => snapshot.forEach(restoreHistoryItem) },
    });
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
    } catch {
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

  const tabMeta: Record<Tab, { label: string; icon: typeof Bookmark; count: number }> = {
    watchlist: { label: 'My List', icon: Bookmark, count: watchlist.length },
    history: { label: 'History', icon: History, count: history.length },
    collections: { label: 'Collections', icon: Folders, count: collections.length },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 md:pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My List</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Saved in this browser. Back it up any time.
          </p>
        </div>

        {/* Tab & Backup Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div role="tablist" aria-label="Library sections" className="flex items-center gap-1 bg-surface-1 p-1.5 rounded-2xl">
            {TABS.map((tab) => {
              const { label, icon: Icon, count } = tabMeta[tab];
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
                    selected ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {label} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Backup Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Download JSON Backup"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-1 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Backup</span>
            </button>

            <label
              title="Restore from JSON Backup file"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-1 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors shadow-md"
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
          <div className="flex items-center gap-2" role="group" aria-label="Filter by type">
            {(['all', 'movie', 'tv'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                aria-pressed={filterType === f}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filterType === f ? 'bg-surface-3 text-white' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Series'}
              </button>
            ))}
          </div>

          {activeTab === 'history' && history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      )}

      {/* Watchlist Tab Content */}
      {activeTab === 'watchlist' && (
        <>
          {filteredWatchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 mt-4">
              {filteredWatchlist.map((item) => (
                <MediaCard
                  key={`${item.type}-${item.id}`}
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
              ))}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center text-subtle mb-4">
                <Bookmark className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Your list is empty</h2>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                Explore movies and series, and click the bookmark icon to save titles here for later.
              </p>
              <Link
                href="/movies"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-semibold text-sm transition-all shadow-lg"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 mt-4">
              {filteredHistory.map((item) => {
                const playUrl =
                  item.type === 'tv' && item.season && item.episode
                    ? `/watch/tv/${item.id}?season=${item.season}&episode=${item.episode}`
                    : `/watch/${item.type}/${item.id}`;
                const remaining =
                  item.durationSeconds && item.progressSeconds
                    ? formatRuntime(Math.max(1, Math.floor((item.durationSeconds - item.progressSeconds) / 60)))
                    : '';

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="group relative rounded-xl overflow-hidden bg-surface-1 transition-all shadow-md flex flex-col"
                  >
                    {/* Backdrop */}
                    <div className="relative aspect-video w-full overflow-hidden bg-surface-1">
                      <Image
                        src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />

                      <Link
                        href={playUrl}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleRemoveHistory(item)}
                        aria-label={`Remove ${item.title} from history`}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-zinc-300 hover:text-white hover:bg-black/90 transition-colors z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      {item.progressPercent ? (
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/70" aria-hidden="true">
                          <div className="h-full bg-accent" style={{ width: `${Math.max(3, item.progressPercent)}%` }} />
                        </div>
                      ) : null}
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
                          <p className="text-xs text-accent font-medium mt-1">
                            Season {item.season}, Episode {item.episode}{' '}
                            {item.episodeTitle ? `• ${item.episodeTitle}` : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 mt-1 capitalize">{item.type}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 text-xs text-zinc-400">
                        <span>
                          {formatRelativeTime(item.lastWatchedAt)}
                          {item.finished ? ' · Watched' : remaining ? ` · ${remaining} left` : ''}
                        </span>
                        <Link
                          href={playUrl}
                          className="font-semibold text-accent hover:text-white flex items-center gap-1"
                        >
                          <span>{item.finished ? 'Watch again' : 'Resume'}</span>
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
              <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center text-subtle mb-4">
                <History className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">No watch history yet</h2>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                When you stream movies and episodes, your progress will be saved here automatically.
              </p>
              <Link
                href="/movies"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-semibold text-sm transition-all shadow-lg"
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
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Collections</h2>
              <p className="text-xs text-zinc-400">Group titles any way you like.</p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-semibold text-xs shadow-lg transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>

          {collections.length > 0 ? (
            <div className="flex flex-col gap-8">
              {collections.map((col) => (
                <div key={col.id} className="p-6 rounded-2xl bg-surface-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{col.name}</h3>
                      {col.description && <p className="text-xs text-zinc-400 mt-0.5">{col.description}</p>}
                      <span className="text-xs text-zinc-400">{col.items.length} titles</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deleteCollection(col.id);
                        toast(`Deleted "${col.name}"`, {
                          tone: 'info',
                          action: { label: 'Undo', onClick: () => restoreCollection(col) },
                        });
                      }}
                      className="p-2 rounded-xl bg-surface-3 hover:bg-accent text-zinc-300 hover:text-white transition-colors"
                      aria-label={`Delete collection ${col.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {(() => {
                    const candidates = watchlist.filter(
                      (w) => !col.items.some((i) => i.id === w.id && i.type === w.type)
                    );
                    if (candidates.length === 0) return null;
                    return (
                      <label className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span>Add from My List:</span>
                        <select
                          value=""
                          onChange={(e) => {
                            const picked = candidates.find((w) => `${w.type}-${w.id}` === e.target.value);
                            if (picked) {
                              addItemToCollection(col.id, picked);
                              toast(`Added "${picked.title}" to ${col.name}`);
                            }
                          }}
                          className="bg-surface-1 rounded-lg px-3 py-1.5 text-zinc-100 text-xs max-w-[260px]"
                        >
                          <option value="" disabled>
                            Choose a title…
                          </option>
                          {candidates.map((w) => (
                            <option key={`${w.type}-${w.id}`} value={`${w.type}-${w.id}`}>
                              {w.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })()}

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
                            type="button"
                            onClick={() => removeItemFromCollection(col.id, item.id, item.type)}
                            aria-label={`Remove ${item.title} from ${col.name}`}
                            className="absolute top-12 right-2.5 z-20 p-2 rounded-full bg-black/70 hover:bg-accent text-white shadow-lg transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      This collection is empty. Add titles from My List above.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center text-subtle mb-4">
                <FolderPlus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">No custom collections yet</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                Group movies into folders like &quot;Anime Marathon&quot; or &quot;Date Night Classics&quot;.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-semibold text-sm transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Create a collection</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Collection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New collection"
      >
        <form onSubmit={handleCreateCollection} className="flex flex-col gap-4 p-2">
          <div>
            <label htmlFor="collection-name" className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Collection Name
            </label>
            <input
              id="collection-name"
              type="text"
              required
              placeholder="e.g. Marvel Marathon, Anime Favorites..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500"
            />
          </div>

          <div>
            <label htmlFor="collection-desc" className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <input
              id="collection-desc"
              type="text"
              placeholder="e.g. My favorite weekend movie binges"
              value={newCollectionDesc}
              onChange={(e) => setNewCollectionDesc(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-surface-3 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-lg"
            >
              Create Collection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <WatchlistContent />
    </Suspense>
  );
}
