# Personal Streaming Movie & TV App Implementation Plan

**Spec Reference:** [`docs/superpowers/specs/2026-08-28-streaming-movie-app-design.md`](file:///C:/Users/admin/Desktop/j1%20movies/docs/superpowers/specs/2026-08-28-streaming-movie-app-design.md)  
**Target Date:** 2026-08-28  

---

## Phase 1: Project Initialization & Core Configuration
- [ ] Initialize Next.js project with App Router, TypeScript, and Tailwind CSS.
- [ ] Install dependencies (`lucide-react`, `zustand`, `clsx`, `tailwind-merge`).
- [ ] Configure `next.config.ts` for remote TMDB image domains (`image.tmdb.org`).
- [ ] Setup `.env.example` and environment variable config for `TMDB_API_KEY` / `TMDB_READ_ACCESS_TOKEN`.
- [ ] Create TypeScript types definition in `src/types/tmdb.d.ts`.

## Phase 2: Core Utilities, State Store & TMDB Route Proxy
- [ ] Implement Zustand `localStorage` store in `src/lib/store.ts` (Watchlist, Watch History, Continue Watching).
- [ ] Implement Videasy player URL builder and helpers in `src/lib/videasy.ts`.
- [ ] Implement Next.js Catch-all API Route Handler in `src/app/api/tmdb/[...path]/route.ts` with response caching.
- [ ] Create client TMDB fetcher wrapper in `src/lib/tmdb.ts` for trending, details, search, genres, and TV seasons/episodes.

## Phase 3: Base Layout & Common UI Components
- [ ] Implement global dark theme styling and responsive layout in `src/app/layout.tsx`.
- [ ] Create `Navbar` and `MobileNav` with responsive navigation, logo, and search trigger.
- [ ] Create `Footer` with legal disclaimer and TMDB attribution.
- [ ] Create `SkeletonCard`, `SkeletonBanner`, and `Badge` loading/visual UI components.
- [ ] Create `SearchBar` with live 300ms debounce and autocomplete results dropdown.
- [ ] Create `BookmarkButton` with reactive Zustand state toggle.

## Phase 4: Media Components & Homepage
- [ ] Build `HeroBanner` with featured backdrop, metadata, synopsis, and quick play/info actions.
- [ ] Build `MediaCard` with poster, hover zoom, rating score badge, and watchlist toggle.
- [ ] Build `MediaCarousel` with smooth horizontal scrolling buttons and responsive touch swiping.
- [ ] Assemble `src/app/page.tsx` with Hero Banner and categorized carousels (Continue Watching, Trending, Top Rated, Action, Sci-Fi, Comedy).

## Phase 5: Catalog & Search Pages
- [ ] Implement Movies catalog (`src/app/movies/page.tsx`) with genre pill filters and pagination/load more.
- [ ] Implement TV Shows catalog (`src/app/tv/page.tsx`) with genre pill filters and pagination/load more.
- [ ] Implement Search page (`src/app/search/page.tsx`) with real-time multi-type search results grid.
- [ ] Implement Watchlist & History page (`src/app/watchlist/page.tsx`) with tabbed view and clear/remove controls.

## Phase 6: Media Details Page
- [ ] Build `/details/[type]/[id]/page.tsx` with backdrop hero, poster, metadata, cast list, and trailer preview modal.
- [ ] For TV Shows: Build interactive Season selector dropdown and Episode list cards with thumbnails and descriptions.
- [ ] Add "Play Now" CTA navigating directly to cinema watch page.
- [ ] Add "Similar Recommendations" carousel at the bottom.

## Phase 7: Cinema Watch Page & Player Integration
- [ ] Build `/watch/[type]/[id]/page.tsx` with responsive 16:9 `VideasyPlayer` iframe embed.
- [ ] Implement TV Show `EpisodeDrawer` and `NextEpisodeButton` with automatic season/episode URL query routing.
- [ ] Wire up automatic "Continue Watching" history recording to Zustand `localStorage` upon media load.
- [ ] Add Theater mode controls and quick actions bar.

## Phase 8: Verification, Edge Case Testing & Polish
- [ ] Verify TMDB proxy with and without local API keys (check friendly fallback guide).
- [ ] Verify Videasy player movie & TV embed rendering.
- [ ] Verify multi-season TV episode switching and Next Episode progression.
- [ ] Verify `localStorage` state persistence across browser reload.
- [ ] Test mobile and desktop responsiveness.
