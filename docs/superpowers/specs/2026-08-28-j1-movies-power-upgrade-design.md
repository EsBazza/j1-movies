# J1 Movies - Power Upgrade & Features Design Specification

**Date:** 2026-08-28  
**Topic:** J1 Movies Platform Enhancements  
**Status:** Approved by User  

---

## 1. Overview & Goals

Expand **J1 Movies** with 5 major features to deliver an uncompromising, high-reliability personal cinema experience:
1. **Multi-Server Streaming Switcher:** Multi-provider fallback engine (Videasy, VidLink, Vidsrc VIP, AutoEmbed) ensuring 99.9% stream availability.
2. **Actor & Director Filmography Explorer (`/person/[id]`):** Dedicated person profiles with biographies, photos, and sortable career works.
3. **Advanced Discovery Filter Suite:** Multi-criteria drawer with Era/Year sliders, Minimum TMDB Rating thresholds, Language filters, and sorting.
4. **Netflix-Style In-Modal Quick Preview:** Fast trailer and synopsis overlay without navigating away from carousels or search results.
5. **Custom Collections & 1-Click JSON Backup:** Custom movie folders and effortless device-to-device JSON export and import.

---

## 2. System Architecture & Components

### 2.1 Provider Registry (`src/lib/playerSources.ts`)
```typescript
export interface StreamingSource {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: number | string) => string;
  getTvUrl: (tmdbId: number | string, season: number, episode: number) => string;
}

export const STREAMING_SERVERS: StreamingSource[] = [
  {
    id: 'videasy',
    name: 'Server 1 (Videasy HD)',
    badge: 'Fast',
    getMovieUrl: (id) => `https://player.videasy.net/movie/${id}?color=e50914`,
    getTvUrl: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=e50914`,
  },
  {
    id: 'vidlink',
    name: 'Server 2 (VidLink Pro)',
    badge: 'Multi-Audio',
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914`,
    getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914`,
  },
  {
    id: 'vidsrc',
    name: 'Server 3 (Vidsrc VIP)',
    badge: 'Backup',
    getMovieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'autoembed',
    name: 'Server 4 (AutoEmbed)',
    badge: 'Global',
    getMovieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];
```

### 2.2 Person Details & Filmography (`src/app/person/[id]/page.tsx`)
* TMDB Endpoint: `/api/tmdb/person/{id}?append_to_response=combined_credits,images`
* Interface: `TMDBPersonDetails` with biography, profile picture, birthday, known for department, and combined acting/directing cast credits.
* UI Features: Profile header, biography accordion, type tabs (`All`, `Movies`, `TV`, `Crew/Director`), sort selector (`Popularity`, `Rating`, `Date`), and direct watch links.

### 2.3 Advanced Filter Suite (`src/components/common/AdvancedFilterDrawer.tsx`)
* Filters:
  * **Era / Year:** All Years, 2024-2026, 2020-2023, 2010s, 2000s, 90s, Vintage Classics.
  * **Rating Minimum:** Any, 6.0+, 7.0+, 8.0+ Masterpieces.
  * **Language:** All Languages, English (en), Japanese (ja - Anime), Korean (ko - K-Drama), Spanish (es), French (fr), Hindi (hi).
  * **Sort:** Popularity, Rating, Release Date, Title.
* Live filter chip tags with 1-click Reset button.

### 2.4 Quick Preview Modal (`src/components/media/QuickPreviewModal.tsx`)
* Lightweight accessible dialog showing:
  * YouTube trailer video embed or high-res backdrop with play button overlay.
  * Rating score, release year, genres, overview, and cast list.
  * Direct action buttons: "▶ Watch Now" and "+ Add to Watchlist".

### 2.5 Zustand Store Custom Collections & Backup Schema (`src/lib/store.ts`)
```typescript
export interface CustomCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  items: WatchlistItem[];
}

export interface UserStore {
  watchlist: WatchlistItem[];
  history: WatchHistoryItem[];
  collections: CustomCollection[];
  preferredServerId: string;
  
  // Actions
  setPreferredServerId: (id: string) => void;
  createCollection: (name: string, description?: string) => void;
  deleteCollection: (id: string) => void;
  addItemToCollection: (collectionId: string, item: WatchlistItem) => void;
  removeItemFromCollection: (collectionId: string, itemId: number, type: MediaType) => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}
```

---

## 3. Verification & Testing

* [ ] Multi-server streaming selector changes iframe URL smoothly across all 4 servers.
* [ ] Actor & Director profile pages display accurate biography, photos, and filmography list.
* [ ] Cast list avatars in detail and watch pages link directly to `/person/[id]`.
* [ ] Advanced filter drawer applies year, rating, and language filters with immediate results.
* [ ] Quick Preview modal opens and plays trailers without interrupting browsing.
* [ ] JSON export downloads full user backup, and import restores watchlist/history accurately.
