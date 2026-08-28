# Personal Streaming Movie & TV Web Application Design Specification

**Date:** 2026-08-28  
**Topic:** Personal Streaming Movie Website  
**Status:** Approved by User  

---

## 1. Overview & Goals

Build a high-performance, Netflix/Disney+ inspired personal movie and TV show streaming web application using **Next.js (App Router)**, **The Movie Database (TMDB) API**, and **Videasy Embed Player**.

### Key Objectives
* **Zero Database & Zero Auth:** 100% client-side persistence for bookmarks, watchlists, and "continue watching" state using browser `localStorage`.
* **Full Media Support:** Seamless browsing and streaming for both Movies and Multi-Season TV Shows (with season/episode switcher).
* **Modern Streaming UI:** Netflix-style dark cinema interface with a hero spotlight banner, horizontal scrolling carousels, genre exploration, and debounced live search.
* **Dedicated Cinema Watch Page:** Fullscreen/theater-mode player with season/episode drawer and related recommendations.
* **Secure API Layer:** Next.js Route Handlers proxying TMDB requests with server-side API key protection and response caching.

---

## 2. Technology Stack & Dependencies

* **Framework:** Next.js 16 (App Router, React 19)
* **Styling & Icons:** Tailwind CSS, Lucide React icons, Tailwind Scrollbar
* **State Management:** Zustand with `persist` middleware (`localStorage`)
* **External APIs:**
  * **TMDB API v3 / v4:** Content metadata, cast, search, genres, trailers, TV season & episode data.
  * **Videasy Player Embed:** 
    * Movies: `https://player.videasy.net/movie/{tmdb_id}`
    * TV Shows: `https://player.videasy.net/tv/{tmdb_id}/{season}/{episode}`

---

## 3. System Architecture & Routing

### 3.1 Directory Structure
```text
src/
├── app/
│   ├── layout.tsx                     # Global layout (Dark theme, Navbar, Footer, Providers)
│   ├── page.tsx                       # Homepage (Hero Spotlight + Media Carousels)
│   ├── movies/
│   │   └── page.tsx                   # Movies Catalog & Genre Filter Explorer
│   ├── tv/
│   │   └── page.tsx                   # TV Shows Catalog & Filter Explorer
│   ├── search/
│   │   └── page.tsx                   # Live Search & Results Grid
│   ├── watchlist/
│   │   └── page.tsx                   # Saved Watchlist & Continue Watching History
│   ├── details/
│   │   └── [type]/
│   │       └── [id]/
│   │           └── page.tsx           # Media Details, Cast, Seasons/Episodes, Trailer Modal
│   ├── watch/
│   │   └── [type]/
│   │       └── [id]/
│   │           └── page.tsx           # Cinema Player Page with Episode Drawer & Next Ep
│   └── api/
│       └── tmdb/
│           └── [...path]/
│               └── route.ts           # Server-side TMDB proxy & cache handler
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                 # Frosted glass header, search trigger, navigation
│   │   ├── MobileNav.tsx              # Bottom navigation bar for mobile screens
│   │   └── Footer.tsx                 # Minimalist cinema footer
│   ├── media/
│   │   ├── HeroBanner.tsx             # Featured media spotlight with backdrop & actions
│   │   ├── MediaCarousel.tsx          # Smooth horizontal scrolling movie/show row
│   │   ├── MediaCard.tsx              # Poster card with hover zoom, rating badge, & quick actions
│   │   ├── GenrePills.tsx             # Scrollable genre filter tags
│   │   └── CastList.tsx               # Actors/crew avatar carousel
│   ├── player/
│   │   ├── VideasyPlayer.tsx          # Responsive 16:9 iframe embed with sandbox & loading state
│   │   ├── EpisodeDrawer.tsx          # TV Season/Episode selector drawer
│   │   ├── NextEpisodeButton.tsx      # Quick jump to next episode
│   │   └── PlayerControlsBar.tsx      # Theater mode toggle, bookmark action, share button
│   ├── ui/
│   │   ├── SkeletonCard.tsx           # Shimmer loading cards for carousels and grids
│   │   ├── SkeletonBanner.tsx         # Shimmer placeholder for hero banner
│   │   ├── Modal.tsx                  # Accessible trailer and dialog modal
│   │   └── Badge.tsx                  # HD, 4K, TMDB rating badge component
│   └── common/
│       ├── SearchBar.tsx              # Debounced instant search input with clear button
│       └── BookmarkButton.tsx         # Add/Remove watchlist toggle button with optimistic UI
├── lib/
│   ├── tmdb.ts                        # Client API wrapper calling Next.js TMDB proxy
│   ├── videasy.ts                     # URL builders and config for Videasy player
│   └── store.ts                       # Zustand state store with localStorage persistence
└── types/
    └── tmdb.d.ts                      # TypeScript definitions for TMDB & App entities
```

---

## 4. Component & Page Specifications

### 4.1 Home Page (`/`)
* **Hero Banner:** Random or top trending media item. Shows title, release year, genre tags, vote average, synopsis preview, `▶ Play Now` button (navigates to `/watch/[type]/[id]`), and `ℹ Info` button (navigates to `/details/[type]/[id]`).
* **Continue Watching Row:** Visible if user has watch history stored in `localStorage`.
* **Category Carousels:**
  * Trending Today (Combined Movies & TV)
  * Popular Movies
  * Top Rated TV Shows
  * Action & Adventure
  * Sci-Fi & Fantasy
  * Comedy / Drama

### 4.2 Details Page (`/details/[type]/[id]`)
* Large high-resolution backdrop header with gradient overlay.
* Poster image, runtime, release date, user rating percentage, tagline, and full overview.
* Cast & Crew carousel with character names and actor photos.
* If `type === 'tv'`: Dynamic Season selector dropdown showing list of episodes with thumbnails, titles, runtimes, and overviews.
* "Play" button linking directly to the player.
* Recommended / Similar titles carousel.

### 4.3 Cinema Watch Page (`/watch/[type]/[id]`)
* 16:9 responsive container embedding Videasy:
  * Movies: `https://player.videasy.net/movie/{id}`
  * TV Shows: `https://player.videasy.net/tv/{id}/{season}/{episode}`
* If `type === 'tv'`:
  * URL query parameters manage active season & episode (e.g., `/watch/tv/1399?season=1&episode=1`).
  * "Next Episode" button automatically navigates to `episode + 1` or Season increment.
  * Side/bottom collapsible episode list drawer for quick switching.
* Automatic local storage update recording item to `watchHistory` on visit.

### 4.4 Watchlist & History Page (`/watchlist`)
* **Watchlist Tab:** Shows all saved titles in a grid with filters (`All`, `Movies`, `TV Shows`). Includes quick play and remove buttons.
* **History Tab:** Displays recently watched titles with last-watched episode indicators, relative timestamps (e.g., "Watched 2 hours ago"), and a "Clear All History" button.

---

## 5. Data Flow & Local Storage Schema

### 5.1 TMDB Proxy Route (`/api/tmdb/[...path]`)
* Reads `TMDB_API_KEY` (or `TMDB_READ_ACCESS_TOKEN`) from server environment variables.
* Appends `api_key` and forwards incoming query params to `https://api.themoviedb.org/3/...`.
* Sets appropriate cache headers (`next: { revalidate: 3600 }` for listings, `86400` for details).

### 5.2 Zustand Storage Schema
```typescript
export interface MediaItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
}

export interface WatchHistoryItem extends MediaItem {
  season?: number;
  episode?: number;
  episodeTitle?: string;
  lastWatchedAt: number;
}

export interface UserStore {
  watchlist: MediaItem[];
  history: WatchHistoryItem[];
  addToWatchlist: (item: MediaItem) => void;
  removeFromWatchlist: (id: number, type: 'movie' | 'tv') => void;
  isInWatchlist: (id: number, type: 'movie' | 'tv') => boolean;
  saveProgress: (item: WatchHistoryItem) => void;
  removeFromHistory: (id: number, type: 'movie' | 'tv') => void;
  clearHistory: () => void;
}
```

---

## 6. Error Handling & Edge Cases

1. **Missing TMDB Key:** Display a friendly alert banner explaining how to configure `.env.local`.
2. **Missing Media Artwork:** Fallback SVG poster placeholder with title text when `poster_path` is null.
3. **Empty Watchlist / History State:** Clean illustrations and "Explore Movies" CTA buttons.
4. **Videasy Embed Loading:** Subtle skeleton backdrop while the iframe initializes.

---

## 7. Verification & Acceptance Criteria

* [ ] TMDB Proxy successfully delivers trending, search, genres, and media details.
* [ ] Movies play correctly in Videasy iframe on `/watch/movie/[id]`.
* [ ] TV Shows play with accurate season/episode parameters on `/watch/tv/[id]?season=X&episode=Y`.
* [ ] Next Episode navigation works seamlessly for multi-episode series.
* [ ] Watchlist and Continue Watching persist in browser `localStorage` across page reloads.
* [ ] Responsive design works across mobile, tablet, and desktop screens.
