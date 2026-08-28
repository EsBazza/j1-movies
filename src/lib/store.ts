'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WatchlistItem, WatchHistoryItem, CustomCollection, MediaType } from '@/types/tmdb';

interface UserState {
  watchlist: WatchlistItem[];
  history: WatchHistoryItem[];
  collections: CustomCollection[];
  preferredServerId: string;
  hasHydrated: boolean;
  
  setHasHydrated: (state: boolean) => void;
  setPreferredServerId: (id: string) => void;
  
  // Watchlist Actions
  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeFromWatchlist: (id: number, type: MediaType) => void;
  isInWatchlist: (id: number, type: MediaType) => boolean;
  
  // History Actions
  saveProgress: (item: Omit<WatchHistoryItem, 'lastWatchedAt'>) => void;
  removeFromHistory: (id: number, type: MediaType) => void;
  clearHistory: () => void;

  // Custom Collections
  createCollection: (name: string, description?: string) => void;
  deleteCollection: (id: string) => void;
  addItemToCollection: (collectionId: string, item: WatchlistItem) => void;
  removeItemFromCollection: (collectionId: string, itemId: number, type: MediaType) => void;

  // Backup & Restore
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      history: [],
      collections: [],
      preferredServerId: 'videasy',
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),
      
      setPreferredServerId: (id) => set({ preferredServerId: id }),

      addToWatchlist: (item) => {
        const current = get().watchlist;
        const exists = current.some((w) => w.id === item.id && w.type === item.type);
        if (!exists) {
          set({
            watchlist: [{ ...item, addedAt: Date.now() }, ...current],
          });
        }
      },

      removeFromWatchlist: (id, type) => {
        set({
          watchlist: get().watchlist.filter((w) => !(w.id === id && w.type === type)),
        });
      },

      isInWatchlist: (id, type) => {
        return get().watchlist.some((w) => w.id === id && w.type === type);
      },

      saveProgress: (item) => {
        const current = get().history;
        const filtered = current.filter((h) => !(h.id === item.id && h.type === item.type));
        set({
          history: [{ ...item, lastWatchedAt: Date.now() }, ...filtered].slice(0, 50),
        });
      },

      removeFromHistory: (id, type) => {
        set({
          history: get().history.filter((h) => !(h.id === id && h.type === type)),
        });
      },

      clearHistory: () => {
        set({ history: [] });
      },

      createCollection: (name, description) => {
        const newCollection: CustomCollection = {
          id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          description,
          createdAt: Date.now(),
          items: [],
        };
        set({
          collections: [...get().collections, newCollection],
        });
      },

      deleteCollection: (id) => {
        set({
          collections: get().collections.filter((c) => c.id !== id),
        });
      },

      addItemToCollection: (collectionId, item) => {
        set({
          collections: get().collections.map((col) => {
            if (col.id === collectionId) {
              const exists = col.items.some((i) => i.id === item.id && i.type === item.type);
              if (!exists) {
                return { ...col, items: [item, ...col.items] };
              }
            }
            return col;
          }),
        });
      },

      removeItemFromCollection: (collectionId, itemId, type) => {
        set({
          collections: get().collections.map((col) => {
            if (col.id === collectionId) {
              return {
                ...col,
                items: col.items.filter((i) => !(i.id === itemId && i.type === type)),
              };
            }
            return col;
          }),
        });
      },

      exportDataJSON: () => {
        const state = get();
        const exportObj = {
          version: '1.0',
          appName: 'J1 Movies',
          exportedAt: new Date().toISOString(),
          watchlist: state.watchlist,
          history: state.history,
          collections: state.collections,
          preferredServerId: state.preferredServerId,
        };
        return JSON.stringify(exportObj, null, 2);
      },

      importDataJSON: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr);
          if (data && (Array.isArray(data.watchlist) || Array.isArray(data.history))) {
            set({
              watchlist: Array.isArray(data.watchlist) ? data.watchlist : get().watchlist,
              history: Array.isArray(data.history) ? data.history : get().history,
              collections: Array.isArray(data.collections) ? data.collections : get().collections,
              preferredServerId: data.preferredServerId || get().preferredServerId,
            });
            return true;
          }
          return false;
        } catch (e) {
          console.error('Failed to import JSON data:', e);
          return false;
        }
      },
    }),
    {
      name: 'j1-movies-user-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
