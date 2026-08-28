'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WatchlistItem, WatchHistoryItem, MediaType } from '@/types/tmdb';

interface UserState {
  watchlist: WatchlistItem[];
  history: WatchHistoryItem[];
  hasHydrated: boolean;
  
  setHasHydrated: (state: boolean) => void;
  
  // Watchlist Actions
  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeFromWatchlist: (id: number, type: MediaType) => void;
  isInWatchlist: (id: number, type: MediaType) => boolean;
  
  // History Actions
  saveProgress: (item: Omit<WatchHistoryItem, 'lastWatchedAt'>) => void;
  removeFromHistory: (id: number, type: MediaType) => void;
  clearHistory: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      history: [],
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

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
          history: [{ ...item, lastWatchedAt: Date.now() }, ...filtered].slice(0, 50), // keep last 50
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
    }),
    {
      name: 'j1-movies-user-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
