'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bookmark,
  History,
  FolderPlus,
  Download,
  Upload,
  Trash2,
  Play,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Shuffle,
  type LucideIcon,
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb';
import { formatRelativeTime, formatRuntime, cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/MediaCard';
import { PAGE_GUTTER } from '@/components/media/MediaCarousel';
import { Modal } from '@/components/ui/Modal';
import { Tabs, tabPanelProps } from '@/components/ui/Tabs';
import { Chip } from '@/components/ui/Chip';
import { Button, LinkButton } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { openSurpriseMe } from '@/components/common/SurpriseMe';
import { CustomCollection, WatchHistoryItem, WatchlistItem } from '@/types/tmdb';

type Tab = 'watchlist' | 'history' | 'collections';
const TABS: Tab[] = ['watchlist', 'history', 'collections'];
const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10';

const toNormalized = (item: WatchlistItem) => ({
  id: item.id,
  type: item.type,
  title: item.title,
  overview: '',
  posterPath: item.poster_path,
  backdropPath: item.backdrop_path,
  rating: item.vote_average,
  releaseDate: item.release_date || '',
});

function EmptyState({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-20 sm:py-28 flex flex-col items-center text-center animate-fade-in">
      <span className="w-20 h-20 rounded-full bg-[color-mix(in_srgb,var(--dyn-glow-1)_22%,rgb(255_255_255/0.05))] flex items-center justify-center">
        <Icon className="w-9 h-9 text-white" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-sm sm:text-base text-muted max-w-md">{body}</p>
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/** 2×2 poster mosaic from the first four titles (or a tinted placeholder). */
function CollectionCover({ collection }: { collection: CustomCollection }) {
  const posters = collection.items.filter((i) => i.poster_path).slice(0, 4);
  return (
    <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-panel overflow-hidden flex-shrink-0 bg-[color-mix(in_srgb,var(--dyn-glow-2)_25%,rgb(255_255_255/0.05))]">
      {posters.length >= 4 ? (
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          {posters.map((p) => (
            <div key={`${p.type}-${p.id}`} className="relative">
              <Image src={getPosterUrl(p.poster_path, 'w185')} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : posters.length > 0 ? (
        <Image src={getPosterUrl(posters[0].poster_path, 'w342')} alt="" fill sizes="128px" className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <FolderPlus className="w-8 h-8 text-white/70" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

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
    removeFromWatchlist,
    addToWatchlist,
    moveWatchlistItem,
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
  const setActiveTab = (tab: Tab) =>
    router.replace(tab === 'watchlist' ? '/watchlist' : `/watchlist?tab=${tab}`, { scroll: false });
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveHistory = (item: WatchHistoryItem) => {
    removeFromHistory(item.id, item.type);
    toast(`Removed "${item.title}"`, { tone: 'info', action: { label: 'Undo', onClick: () => restoreHistoryItem(item) } });
  };

  const handleClearHistory = () => {
    const snapshot = history;
    clearHistory();
    toast('Watch history cleared', { tone: 'info', action: { label: 'Undo', onClick: () => snapshot.forEach(restoreHistoryItem) } });
  };

  const handleRemoveFromList = (item: WatchlistItem, index: number) => {
    removeFromWatchlist(item.id, item.type);
    toast(`Removed "${item.title}"`, {
      tone: 'info',
      action: {
        label: 'Undo',
        onClick: () => {
          addToWatchlist(item);
          // addToWatchlist puts it first; move it back to where it was
          moveWatchlistItem(0, index);
        },
      },
    });
  };

  const handleExport = () => {
    try {
      const blob = new Blob([exportDataJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `j1-movies-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Backup downloaded');
    } catch {
      toast("Couldn't create the backup", { tone: 'info' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = importDataJSON(event.target?.result as string);
      toast(ok ? 'Library restored' : "That file isn't a J1 Movies backup", { tone: ok ? 'success' : 'info' });
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
    toast('Collection created');
  };

  // Reordering works on the full, unfiltered list so indices match the store
  const canReorder = filterType === 'all' && watchlist.length > 1;
  const editing = isEditingOrder && canReorder;
  const filteredWatchlist = filterType === 'all' ? watchlist : watchlist.filter((i) => i.type === filterType);
  const filteredHistory = filterType === 'all' ? history : history.filter((i) => i.type === filterType);

  const typeChips = (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
      {(['all', 'movie', 'tv'] as const).map((f) => (
        <Chip
          key={f}
          selected={filterType === f}
          onClick={() => {
            setFilterType(f);
            if (f !== 'all') setIsEditingOrder(false);
          }}
        >
          {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'Series'}
        </Chip>
      ))}
    </div>
  );

  const browseButtons = (
    <>
      <LinkButton href="/movies">Browse movies</LinkButton>
      <Button variant="secondary" onClick={openSurpriseMe}>
        <Shuffle className="w-4 h-4" aria-hidden="true" />
        Surprise me
      </Button>
    </>
  );

  return (
    <div className={cn(PAGE_GUTTER, 'pt-28 lg:pt-36 pb-28 lg:pb-16')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">My List</h1>
          <p className="mt-2 text-sm sm:text-base text-muted">Saved in this browser — no account needed. Back it up any time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Backup
          </Button>
          <label className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/12 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-[var(--dyn-accent)]">
            <Upload className="w-4 h-4" aria-hidden="true" />
            Restore
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} className="sr-only" />
          </label>
        </div>
      </div>

      <div className="mt-10 sticky top-16 lg:top-20 z-20 -mx-5 px-5 sm:-mx-10 sm:px-10 lg:-mx-16 lg:px-16 bg-bg/85 backdrop-blur-md">
        <Tabs
          label="Library sections"
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { id: 'watchlist', label: 'Saved', count: watchlist.length },
            { id: 'history', label: 'History', count: history.length },
            { id: 'collections', label: 'Collections', count: collections.length },
          ]}
        />
      </div>

      <div className="pt-8" {...tabPanelProps(activeTab)} key={activeTab}>
        <div className="animate-fade-in">
          {/* ── Saved ─────────────────────────────────────────────── */}
          {activeTab === 'watchlist' &&
            (watchlist.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="Nothing saved yet"
                body="Tap the bookmark on any title and it lands here, ready for later."
              >
                {browseButtons}
              </EmptyState>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                  {typeChips}
                  {canReorder && (
                    <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={() => setIsEditingOrder((v) => !v)}>
                      <GripVertical className="w-4 h-4" aria-hidden="true" />
                      {editing ? 'Done' : 'Edit order'}
                    </Button>
                  )}
                </div>
                {editing && (
                  <p className="-mt-4 mb-6 text-xs sm:text-sm text-muted" aria-live="polite">
                    Drag posters to reorder, or use the arrows.
                  </p>
                )}
                {filteredWatchlist.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted">No {filterType === 'movie' ? 'movies' : 'series'} saved yet.</p>
                ) : (
                  <ul className={cn('stagger reveal', GRID)} data-revealed="true">
                    {filteredWatchlist.map((item, i) => (
                      <li
                        key={`${item.type}-${item.id}`}
                        style={{ '--i': i % 12 } as React.CSSProperties}
                        draggable={editing}
                        onDragStart={(e) => {
                          setDragIndex(i);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          if (dragIndex === null) return;
                          e.preventDefault();
                          setDropIndex(i);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragIndex !== null) moveWatchlistItem(dragIndex, i);
                          setDragIndex(null);
                          setDropIndex(null);
                        }}
                        onDragEnd={() => {
                          setDragIndex(null);
                          setDropIndex(null);
                        }}
                        className={cn(
                          'relative transition-[opacity,transform] duration-200',
                          editing && 'cursor-grab active:cursor-grabbing',
                          dragIndex === i && 'opacity-40',
                          dropIndex === i && dragIndex !== i && 'scale-[0.97]'
                        )}
                      >
                        <div className={cn(editing && 'pointer-events-none select-none')}>
                          <MediaCard item={toNormalized(item)} />
                        </div>
                        {editing && (
                          <div className="absolute inset-x-2 top-2 flex items-center justify-between animate-fade-in">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveWatchlistItem(i, i - 1)}
                                disabled={i === 0}
                                aria-label={`Move ${item.title} earlier`}
                                className="w-9 h-9 rounded-full bg-black/75 text-white flex items-center justify-center disabled:opacity-30"
                              >
                                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveWatchlistItem(i, i + 1)}
                                disabled={i === filteredWatchlist.length - 1}
                                aria-label={`Move ${item.title} later`}
                                className="w-9 h-9 rounded-full bg-black/75 text-white flex items-center justify-center disabled:opacity-30"
                              >
                                <ChevronRight className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromList(item, i)}
                              aria-label={`Remove ${item.title} from My List`}
                              className="w-9 h-9 rounded-full bg-black/75 hover:bg-accent text-white flex items-center justify-center transition-colors"
                            >
                              <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ))}

          {/* ── History ───────────────────────────────────────────── */}
          {activeTab === 'history' &&
            (history.length === 0 ? (
              <EmptyState
                icon={History}
                title="No watch history yet"
                body="Everything you start watching shows up here, so you can pick up where you left off."
              >
                {browseButtons}
              </EmptyState>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                  {typeChips}
                  <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Clear history
                  </Button>
                </div>
                <ul className="stagger reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10" data-revealed="true">
                  {filteredHistory.map((item, i) => {
                    const remaining =
                      item.durationSeconds && item.progressSeconds
                        ? formatRuntime(Math.max(1, Math.round((item.durationSeconds - item.progressSeconds) / 60)))
                        : '';
                    const subtitle = item.type === 'tv' && item.season && item.episode ? `S${item.season} · E${item.episode}` : 'Movie';
                    return (
                      <li key={`${item.type}-${item.id}`} style={{ '--i': i % 12 } as React.CSSProperties} className="group relative">
                        <Link href={`/details/${item.type}/${item.id}#resume`} className="block">
                          <span className="relative block aspect-video rounded-card overflow-hidden bg-surface-2 transition-transform duration-300 ease-out-expo group-hover:scale-[1.02]">
                            <Image
                              src={getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 100vw, 25vw"
                              className="object-cover"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center">
                                <Play className="w-5 h-5 fill-black ml-0.5" aria-hidden="true" />
                              </span>
                            </span>
                            {item.progressPercent && !item.finished ? (
                              <span className="absolute bottom-0 inset-x-0 h-1 bg-white/20" aria-hidden="true">
                                <span className="block h-full bg-accent" style={{ width: `${Math.max(3, item.progressPercent)}%` }} />
                              </span>
                            ) : null}
                          </span>
                          <span className="block mt-3 text-sm font-semibold text-zinc-100 group-hover:text-white truncate">{item.title}</span>
                          <span className="block text-xs text-subtle mt-0.5">
                            {subtitle} · {formatRelativeTime(item.lastWatchedAt)}
                            {item.finished ? ' · Watched' : remaining ? ` · ${remaining} left` : ''}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveHistory(item)}
                          aria-label={`Remove ${item.title} from history`}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ))}

          {/* ── Collections ───────────────────────────────────────── */}
          {activeTab === 'collections' &&
            (collections.length === 0 ? (
              <EmptyState
                icon={FolderPlus}
                title="No collections yet"
                body="Group saved titles any way you like — a weekend marathon, comfort rewatches, date night."
              >
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Create a collection
                </Button>
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-16 sm:gap-20">
                <div className="flex justify-end -mb-6">
                  <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    New collection
                  </Button>
                </div>
                {collections.map((col) => {
                  const candidates = watchlist.filter((w) => !col.items.some((i) => i.id === w.id && i.type === w.type));
                  return (
                    <section key={col.id} aria-labelledby={`col-${col.id}`} className="animate-fade-in">
                      <div className="flex items-start gap-5 sm:gap-6">
                        <CollectionCover collection={col} />
                        <div className="flex-1 min-w-0 pt-1">
                          <h2 id={`col-${col.id}`} className="text-xl sm:text-2xl font-bold text-white truncate">
                            {col.name}
                          </h2>
                          {col.description && <p className="text-sm text-muted mt-1 line-clamp-2">{col.description}</p>}
                          <p className="text-xs text-subtle mt-2">
                            {col.items.length} {col.items.length === 1 ? 'title' : 'titles'}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {candidates.length > 0 && (
                              <label className="relative inline-flex items-center">
                                <span className="sr-only">Add a title from My List to {col.name}</span>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const picked = candidates.find((w) => `${w.type}-${w.id}` === e.target.value);
                                    if (picked) {
                                      addItemToCollection(col.id, picked);
                                      toast(`Added "${picked.title}" to ${col.name}`);
                                    }
                                  }}
                                  className="appearance-none h-9 pl-4 pr-9 rounded-full bg-white/8 hover:bg-white/14 text-xs font-semibold text-white cursor-pointer max-w-[240px]"
                                >
                                  <option value="" disabled>
                                    + Add from My List
                                  </option>
                                  {candidates.map((w) => (
                                    <option key={`${w.type}-${w.id}`} value={`${w.type}-${w.id}`} className="bg-surface-2">
                                      {w.title}
                                    </option>
                                  ))}
                                </select>
                                <Plus className="absolute right-3 w-4 h-4 text-muted pointer-events-none" aria-hidden="true" />
                              </label>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deleteCollection(col.id);
                                toast(`Deleted "${col.name}"`, { tone: 'info', action: { label: 'Undo', onClick: () => restoreCollection(col) } });
                              }}
                              aria-label={`Delete collection ${col.name}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      {col.items.length > 0 ? (
                        <ul className={cn('mt-8', GRID)}>
                          {col.items.map((item) => (
                            <li key={`${item.type}-${item.id}`} className="group relative">
                              <MediaCard item={toNormalized(item)} />
                              <button
                                type="button"
                                onClick={() => removeItemFromCollection(col.id, item.id, item.type)}
                                aria-label={`Remove ${item.title} from ${col.name}`}
                                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/75 hover:bg-accent text-white flex items-center justify-center [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-[opacity,background-color]"
                              >
                                <X className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-6 text-sm text-muted">
                          {candidates.length > 0 ? 'Empty for now — add titles from My List above.' : 'Save titles to My List first, then add them here.'}
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New collection" className="max-w-lg">
        <form onSubmit={handleCreateCollection} className="flex flex-col gap-5">
          <div>
            <label htmlFor="collection-name" className="block text-xs font-semibold uppercase tracking-[0.14em] text-subtle mb-2">
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              required
              placeholder="e.g. Weekend marathon"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full h-12 rounded-control bg-white/6 border border-border px-4 text-white text-sm placeholder:text-subtle focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="collection-desc" className="block text-xs font-semibold uppercase tracking-[0.14em] text-subtle mb-2">
              Description <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="collection-desc"
              type="text"
              placeholder="What's it for?"
              value={newCollectionDesc}
              onChange={(e) => setNewCollectionDesc(e.target.value)}
              className="w-full h-12 rounded-control bg-white/6 border border-border px-4 text-white text-sm placeholder:text-subtle focus:border-accent transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
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
