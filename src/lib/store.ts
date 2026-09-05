'use client';

import { useSyncExternalStore } from 'react';
import { WatchlistItem, WatchHistoryItem, CustomCollection, MediaType } from '@/types/tmdb';

interface UserStoreData {
  watchlist: WatchlistItem[];
  history: WatchHistoryItem[];
  collections: CustomCollection[];
  preferredServerId: string;
}

const STORAGE_KEY = 'j1-movies-user-store';

const defaultData: UserStoreData = {
  watchlist: [],
  history: [],
  collections: [],
  preferredServerId: 'videasy',
};

function getStoredData(): UserStoreData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    const state = parsed.state || parsed;
    return {
      watchlist: Array.isArray(state.watchlist) ? state.watchlist : [],
      history: Array.isArray(state.history) ? state.history : [],
      collections: Array.isArray(state.collections) ? state.collections : [],
      preferredServerId: state.preferredServerId || 'videasy',
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

  isInWatchlist: (id: number, type: MediaType) => {
    return memoryState.watchlist.some((w) => w.id === id && w.type === type);
  },

  saveProgress: (item: Omit<WatchHistoryItem, 'lastWatchedAt'>) => {
    const filtered = memoryState.history.filter((h) => !(h.id === item.id && h.type === item.type));
    memoryState = {
      ...memoryState,
      history: [{ ...item, lastWatchedAt: Date.now() }, ...filtered].slice(0, 50),
    };
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
    };
    return JSON.stringify(exportObj, null, 2);
  },

  importDataJSON: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && (Array.isArray(data.watchlist) || Array.isArray(data.history))) {
        memoryState = {
          watchlist: Array.isArray(data.watchlist) ? data.watchlist : memoryState.watchlist,
          history: Array.isArray(data.history) ? data.history : memoryState.history,
          collections: Array.isArray(data.collections) ? data.collections : memoryState.collections,
          preferredServerId: data.preferredServerId || memoryState.preferredServerId,
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
    hasHydrated: true,
    setHasHydrated: () => {},
    setPreferredServerId: storeApi.setPreferredServerId,
    addToWatchlist: storeApi.addToWatchlist,
    removeFromWatchlist: storeApi.removeFromWatchlist,
    isInWatchlist: storeApi.isInWatchlist,
    saveProgress: storeApi.saveProgress,
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
