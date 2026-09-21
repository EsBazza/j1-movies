# 🚀 Implementation Plan: J1 Movies Obsidian Redesign & Dual-Player Engine

- **Date:** 2026-09-21
- **Design Spec:** [2026-09-21-j1movies-redesign-and-dual-player-design.md](../specs/2026-09-21-j1movies-redesign-and-dual-player-design.md)
- **Status:** Approved for Execution
- **Strict Constraints:**
  - Exclusively **111movies** and **Filmu** for streaming.
  - Smart pre-flight probe chooses the fastest server automatically on load.
  - Dedicated **Anime** (`/anime`) and **K-Drama** (`/kdrama`) hubs.
  - **Zero emojis** and **zero AI-slop** across all UI text, headings, buttons, and badges.
  - Obsidian Crimson color palette (`#0f1014` with `#e50914` accents) and **Bebas Neue** cinema typography.

---

## 📋 Task Checklist

- [ ] **Task 1: Theme & Typography Setup**
  - In `src/app/layout.tsx`: Import `Bebas_Neue` Google font and bind to CSS variable `--font-display`. Update root canvas background to `#0f1014`.
  - In `tailwind.config.ts`: Configure `fontFamily.display = ['var(--font-display)', 'sans-serif']` and add color tokens (`obsidian: '#0f1014'`, `surface: '#14151b'`, `surface-elevated: '#1a1d26'`).
  - In `src/app/globals.css`: Update body background and selection styles to `#0f1014` and `#e50914`.

- [ ] **Task 2: Dual-Player Registry (`src/lib/playerSources.ts` & `src/lib/store.ts`)**
  - In `src/lib/playerSources.ts`: Prune all servers, leaving exclusively:
    - **111movies**: `https://111movies.com/movie/${id}` and `https://111movies.com/tv/${id}/${season}/${episode}`
    - **Filmu**: `https://embed.filmu.in/movie/${id}`, `https://embed.filmu.in/tv/${id}/${season}/${episode}`, and `https://embed.filmu.in/anime/${id}/${episode}`
  - In `src/lib/store.ts`: Default `preferredServerId` to `'111movies'`.

- [ ] **Task 3: Pre-Flight Latency & Health Engine (`src/app/watch/[type]/[id]/page.tsx`)**
  - Implement client-side probe with `fetch` (mode: `no-cors`, 1500ms timeout) against both 111movies and Filmu.
  - Select fastest responding server automatically.
  - Replace server selection modal with sleek floating header switcher pill: `[111movies (Fast)]` and `[Filmu (VIP)]` with 1-click switching.

- [ ] **Task 4: TMDB Anime & K-Drama Endpoints (`src/lib/tmdb.ts`)**
  - Add `getTrendingAnime(page)`, `getPopularAnime(page)`, and `getAnimeMovies(page)` (`with_genres=16&with_original_language=ja`).
  - Add `getTrendingKDrama(page)`, `getTopRatedKDrama(page)`, and `getKDramaMovies(page)` (`with_original_language=ko`).

- [ ] **Task 5: Dedicated Anime (`/anime`) & K-Drama (`/kdrama`) Pages**
  - Create `src/app/anime/page.tsx` with hero banner and categorized shelves (Trending Anime, Action & Shonen, Top Rated Classics, Anime Feature Films).
  - Create `src/app/kdrama/page.tsx` with hero banner and shelves (Trending K-Dramas, Romance & Comedy, Thrillers & Mystery, Korean Cinema Hits).

- [ ] **Task 6: Home Page & Navigation Bar Updates**
  - In `src/app/page.tsx`: Add "Top Trending Anime" and "Popular K-Dramas" shelves with clean "View All" links.
  - In `src/components/layout/Navbar.tsx` and `MobileNav.tsx`: Add navigation links for `Anime` (`/anime`) and `K-Drama` (`/kdrama`). Use clean Lucide SVG icons with zero emojis.

- [ ] **Task 7: Media Card Polish (`src/components/media/MediaCard.tsx`)**
  - Update card micro-borders to `border-white/[0.06] hover:border-red-600/40`.
  - Display clean typographic badges (`4K UHD`, `HD`, year, rating) with zero emojis.

- [ ] **Task 8: Verification & Deployment**
  - Run `npm run build` to verify 0 TS compilation errors.
  - Test `/watch/movie/550`, `/anime`, and `/kdrama` routes.
  - Commit all changes and push to `origin/main` for Vercel deployment.
