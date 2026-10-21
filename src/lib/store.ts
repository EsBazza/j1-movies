'use client';

import { useSyncExternalStore } from 'react';
import { WatchlistItem, WatchHistoryItem, CustomCollection, MediaType } from '@/types/tmdb';
import { DEFAULT_SERVER_ID, isStreamingSourceId } from '@/lib/playerSources';

interface UserStoreData {
  watchlist: WatchlistItem[];
  history: WatchHistoryItem[];
  collections: CustomCollection[];
  preferredServerId: string;
  adShieldEnabled: boolean;
}

type StartWatchingInput = Omit<
  WatchHistoryItem,
  'lastWatchedAt' | 'progressSeconds' | 'durationSeconds' | 'progressPercent' | 'timestampFormatted' | 'finished'
>;

const STORAGE_KEY = 'j1-movies-user-store';
const MAX_HISTORY = 50;
/** Playback ratio at which a title/episode counts as watched */
export const FINISHED_THRESHOLD = 0.9;

function isMediaEntry(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'number' && (v.type === 'movie' || v.type === 'tv') && typeof v.title === 'string';
}

function sanitizeEntries<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value.filter(isMediaEntry) as T[]) : null;
}

function sanitizeCollections(value: unknown): CustomCollection[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string')
    .map((c) => ({ ...c, items: sanitizeEntries<WatchlistItem>(c.items) ?? [] }));
}

export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

const defaultData: UserStoreData = {
  watchlist: [],
  history: [],
  collections: [],
  preferredServerId: DEFAULT_SERVER_ID,
  adShieldEnabled: true,
};

function getStoredData(): UserStoreData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    const state = parsed.state || parsed;
    return {
      watchlist: sanitizeEntries<WatchlistItem>(state.watchlist) ?? [],
      history: sanitizeEntries<WatchHistoryItem>(state.history) ?? [],
      collections: sanitizeCollections(state.collections) ?? [],
      // Migrates users off retired servers (e.g. 111movies, filmu)
      preferredServerId: isStreamingSourceId(state.preferredServerId) ? state.preferredServerId : DEFAULT_SERVER_ID,
      adShieldEnabled: typeof state.adShieldEnabled === 'boolean' ? state.adShieldEnabled : true,
    };
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return defaultData;
  }
}

let memoryState: UserStoreData = defaultData;
if (typeof window !== 'undefined') {
  memoryState = getStoredData();
}

const listeners = new Set<() => void>();

function emitChange() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: memoryState }));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      memoryState = getStoredData();
      listeners.forEach((l) => l());
    }
  });
}

const storeApi = {
  getSnapshot: () => memoryState,
  getServerSnapshot: () => defaultData,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setPreferredServerId: (id: string) => {
    memoryState = { ...memoryState, preferredServerId: id };
    emitChange();
  },

  setAdShieldEnabled: (val: boolean) => {
    memoryState = { ...memoryState, adShieldEnabled: val };
    emitChange();
  },

  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => {
    const exists = memoryState.watchlist.some((w) => w.id === item.id && w.type === item.type);
    if (!exists) {
      memoryState = {
        ...memoryState,
        watchlist: [{ ...item, addedAt: Date.now() }, ...memoryState.watchlist],
      };
      emitChange();
    }
  },

  removeFromWatchlist: (id: number, type: MediaType) => {
    memoryState = {
      ...memoryState,
      watchlist: memoryState.watchlist.filter((w) => !(w.id === id && w.type === type)),
    };
    emitChange();
  },

  /**
   * Records that playback started. Keeps saved progress when resuming the same
   * movie/episode, resets it when switching to a different episode.
   */
  startWatching: (item: StartWatchingInput) => {
    const existing = memoryState.history.find((h) => h.id === item.id && h.type === item.type);
    const sameEpisode = existing && existing.season === item.season && existing.episode === item.episode;
    const progress = sameEpisode
      ? {
          progressSeconds: existing.progressSeconds,
          durationSeconds: existing.durationSeconds,
          progressPercent: existing.progressPercent,
          timestampFormatted: existing.timestampFormatted,
          finished: existing.finished,
        }
      : {};
    const filtered = memoryState.history.filter((h) => !(h.id === item.id && h.type === item.type));
    memoryState = {
      ...memoryState,
      history: [{ ...item, ...progress, lastWatchedAt: Date.now() }, ...filtered].slice(0, MAX_HISTORY),
    };
    emitChange();
  },

  /** Updates the playback position reported by the player for an existing history entry. */
  updateProgress: (id: number, type: MediaType, currentTime: number, duration: number) => {
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;
    const ratio = Math.min(1, Math.max(0, currentTime / duration));
    let changed = false;
    const history = memoryState.history.map((h) => {
      if (h.id !== id || h.type !== type) return h;
      changed = true;
      return {
        ...h,
        progressSeconds: Math.floor(currentTime),
        durationSeconds: Math.floor(duration),
        progressPercent: Math.round(ratio * 100),
        timestampFormatted: formatTimestamp(currentTime),
        finished: h.finished || ratio >= FINISHED_THRESHOLD,
        lastWatchedAt: Date.now(),
      };
    });
    if (!changed) return;
    memoryState = { ...memoryState, history };
    emitChange();
  },

  markFinished: (id: number, type: MediaType) => {
    memoryState = {
      ...memoryState,
      history: memoryState.history.map((h) =>
        h.id === id && h.type === type ? { ...h, finished: true, progressPercent: 100 } : h
      ),
    };
    emitChange();
  },

  /** Re-inserts a previously removed entry (used by "Undo"). */
  restoreHistoryItem: (item: WatchHistoryItem) => {
    const filtered = memoryState.history.filter((h) => !(h.id === item.id && h.type === item.type));
    const history = [...filtered, item].sort((a, b) => b.lastWatchedAt - a.lastWatchedAt).slice(0, MAX_HISTORY);
    memoryState = { ...memoryState, history };
    emitChange();
  },

  removeFromHistory: (id: number, type: MediaType) => {
    memoryState = {
      ...memoryState,
      history: memoryState.history.filter((h) => !(h.id === id && h.type === type)),
    };
    emitChange();
  },

  clearHistory: () => {
    memoryState = { ...memoryState, history: [] };
    emitChange();
  },

  createCollection: (name: string, description?: string) => {
    const newCollection: CustomCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      description,
      createdAt: Date.now(),
      items: [],
    };
    memoryState = {
      ...memoryState,
      collections: [...memoryState.collections, newCollection],
    };
    emitChange();
  },

  deleteCollection: (id: string) => {
    memoryState = {
      ...memoryState,
      collections: memoryState.collections.filter((c) => c.id !== id),
    };
    emitChange();
  },

  addItemToCollection: (collectionId: string, item: WatchlistItem) => {
    memoryState = {
      ...memoryState,
      collections: memoryState.collections.map((col) => {
        if (col.id === collectionId) {
          const exists = col.items.some((i) => i.id === item.id && i.type === item.type);
          if (!exists) {
            return { ...col, items: [item, ...col.items] };
          }
        }
        return col;
      }),
    };
    emitChange();
  },

  removeItemFromCollection: (collectionId: string, itemId: number, type: MediaType) => {
    memoryState = {
      ...memoryState,
      collections: memoryState.collections.map((col) => {
        if (col.id === collectionId) {
          return {
            ...col,
            items: col.items.filter((i) => !(i.id === itemId && i.type === type)),
          };
        }
        return col;
      }),
    };
    emitChange();
  },

  exportDataJSON: () => {
    const exportObj = {
      version: '1.0',
      appName: 'J1 Movies',
      exportedAt: new Date().toISOString(),
      watchlist: memoryState.watchlist,
      history: memoryState.history,
      collections: memoryState.collections,
      preferredServerId: memoryState.preferredServerId,
      adShieldEnabled: memoryState.adShieldEnabled,
    };
    return JSON.stringify(exportObj, null, 2);
  },

  importDataJSON: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && (Array.isArray(data.watchlist) || Array.isArray(data.history))) {
        memoryState = {
          watchlist: sanitizeEntries<WatchlistItem>(data.watchlist) ?? memoryState.watchlist,
          history: sanitizeEntries<WatchHistoryItem>(data.history) ?? memoryState.history,
          collections: sanitizeCollections(data.collections) ?? memoryState.collections,
          preferredServerId: isStreamingSourceId(data.preferredServerId)
            ? data.preferredServerId
            : memoryState.preferredServerId,
          adShieldEnabled: typeof data.adShieldEnabled === 'boolean' ? data.adShieldEnabled : memoryState.adShieldEnabled,
        };
        emitChange();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON data:', e);
      return false;
    }
  },
};

/**
 * Subscribes to a single slice of the store; the component only re-renders when
 * that slice changes (e.g. cards reading `watchlist` ignore progress writes).
 */
export function useUserStoreSelector<T>(selector: (state: UserStoreData) => T): T {
  return useSyncExternalStore(
    storeApi.subscribe,
    () => selector(storeApi.getSnapshot()),
    () => selector(storeApi.getServerSnapshot())
  );
}

export const userStoreActions = storeApi;

export function useUserStore() {
  const data = useSyncExternalStore(
    storeApi.subscribe,
    storeApi.getSnapshot,
    storeApi.getServerSnapshot
  );

  return {
    watchlist: data.watchlist,
    history: data.history,
    collections: data.collections,
    preferredServerId: data.preferredServerId,
    adShieldEnabled: data.adShieldEnabled,
    hasHydrated: true,
    setHasHydrated: () => {},
    setPreferredServerId: storeApi.setPreferredServerId,
    setAdShieldEnabled: storeApi.setAdShieldEnabled,
    addToWatchlist: storeApi.addToWatchlist,
    removeFromWatchlist: storeApi.removeFromWatchlist,
    startWatching: storeApi.startWatching,
    updateProgress: storeApi.updateProgress,
    markFinished: storeApi.markFinished,
    restoreHistoryItem: storeApi.restoreHistoryItem,
    removeFromHistory: storeApi.removeFromHistory,
    clearHistory: storeApi.clearHistory,
    createCollection: storeApi.createCollection,
    deleteCollection: storeApi.deleteCollection,
    addItemToCollection: storeApi.addItemToCollection,
    removeItemFromCollection: storeApi.removeItemFromCollection,
    exportDataJSON: storeApi.exportDataJSON,
    importDataJSON: storeApi.importDataJSON,
  };
}
