# J1 Movies — Ultra-Premium Redesign & Dual-Player Architecture Specification

- **Date:** 2026-09-21
- **Status:** Approved by User
- **Theme:** Obsidian Crimson (Bingr.one inspired, clean, zero emojis, zero AI-slop)

---

## 1. Overview & Goals

This specification defines the complete transformation of J1 Movies into an ultra-premium cinema streaming web platform. It addresses three primary pillars:

1. **Dual-Player Video Engine:** Replaces all previous mirrors with exclusively **111movies** (`111movies.com`) and **Filmu** (`embed.filmu.in`). Includes an automated pre-flight latency probe to benchmark both servers in parallel and mount the fastest, healthiest server automatically, paired with an instant manual toggle.
2. **Dedicated Anime and K-Drama Hubs:** Introduces native `/anime` and `/kdrama` hubs and curated rows on the Home page, powered by TMDB discovery endpoints with Sub/Dub and quality indicators.
3. **Obsidian Crimson Aesthetic:** Redesigns the visual interface to match the high-end look of Bingr.one — deep obsidian `#0f1014` canvas, Bebas Neue cinema display typography, crisp metadata badges, micro-border card glassmorphism, and zero emojis.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                              NAVBAR                                    │
│  [Logo]   Home  •  Movies  •  Series  •  Anime  •  K-Drama  •  My List │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   [/] Home Page             [/anime] Hub              [/kdrama] Hub
   • Hero Slider             • Anime Hero Slider       • K-Drama Hero
   • Trending Movies         • Trending Anime          • Trending K-Dramas
   • Trending Series         • Action & Shonen         • Romantic Dramas
   • Trending Anime (Row)    • Top Rated Classics      • Mystery & Thriller
   • Popular K-Drama (Row)   • Anime Feature Films     • Korean Cinema
         │
         └─────────────────────────┐
                                   ▼
                       [/watch/:type/:id] Page
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    Probe: 111movies.com                     Probe: embed.filmu.in
    (Measure response time)                  (Measure response time)
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
               Auto-Mount Fastest / Healthiest Server
                                   │
                     [111movies] <───> [Filmu]
                        (1-Click Header Switcher)
```

---

## 3. Detailed Component Specifications

### 3.1 Streaming Player System (`src/lib/playerSources.ts`)
The server registry is strictly pruned to two high-performance providers:

```typescript
export interface StreamingSource {
  id: '111movies' | 'filmu';
  name: string;
  badge: string;
  getMovieUrl: (id: number | string) => string;
  getTvUrl: (id: number | string, season: number, episode: number) => string;
  getAnimeUrl?: (id: number | string, episode: number) => string;
}
```

1. **111movies:**
   - ID: `111movies`
   - Movie URL: `https://111movies.com/movie/${id}`
   - TV URL: `https://111movies.com/tv/${id}/${season}/${episode}`
   - Badge: `Clean HD (Fast)`
2. **Filmu:**
   - ID: `filmu`
   - Movie URL: `https://embed.filmu.in/movie/${id}`
   - TV URL: `https://embed.filmu.in/tv/${id}/${season}/${episode}`
   - Anime URL: `https://embed.filmu.in/anime/${id}/${episode}`
   - Badge: `Ultra-Fast (Anime VIP)`

### 3.2 Pre-Flight Benchmark Engine (`src/app/watch/[type]/[id]/page.tsx`)
- On route entry, a `useEffect` probe executes lightweight parallel `fetch` requests with `mode: 'no-cors'` and an `AbortController` timeout of 1500ms to both server endpoints.
- Calculates delta timestamp (`latency = performance.now() - startTime`).
- Selects the server with the lowest latency. If one times out or errors, selects the available server.
- Renders an inline, non-intrusive switcher pill in the watch header:
  - `[111movies (Fast)]`
  - `[Filmu (VIP)]`
- Active server is highlighted with cinema-red accent (`#e50914`).
- Clicking either button swaps the active iframe source immediately with zero page reloads.

### 3.3 Anime & K-Drama Expansion (`src/lib/tmdb.ts`)
Adds clean discovery endpoints querying TMDB:
- `getTrendingAnime(page: number)`: `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc`
- `getPopularAnime(page: number)`: `/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_count.desc`
- `getAnimeMovies(page: number)`: `/discover/movie?with_genres=16&with_original_language=ja&sort_by=popularity.desc`
- `getTrendingKDrama(page: number)`: `/discover/tv?with_original_language=ko&sort_by=popularity.desc`
- `getTopRatedKDrama(page: number)`: `/discover/tv?with_original_language=ko&sort_by=vote_average.desc&vote_count.gte=100`
- `getKDramaMovies(page: number)`: `/discover/movie?with_original_language=ko&sort_by=popularity.desc`

### 3.4 New Pages
1. `src/app/anime/page.tsx`:
   - Hero banner featuring trending anime with Japanese/English title handling.
   - Rows: "Trending Anime", "Top Rated Classics", "Action & Shonen", "Anime Feature Films".
2. `src/app/kdrama/page.tsx`:
   - Hero banner featuring trending Korean series.
   - Rows: "Trending K-Dramas", "Romance & Comedy", "Thrillers & Crime", "Korean Cinema Hits".
3. `src/app/page.tsx` Updates:
   - Appends "Top Trending Anime" and "Popular K-Dramas" rows with "View All" links.

### 3.5 Design Language & Clean UI Guidelines
- **Canvas Background:** `#0f1014`
- **Surface Elevation 1:** `#14151b`
- **Surface Elevation 2:** `#1a1d26` with border `rgba(255, 255, 255, 0.07)`
- **Cinema Red Accent:** `#e50914`
- **Quality Accent:** `#2563eb` (4K / HD badges)
- **Typography:**
  - Google Font `Bebas Neue` loaded in `src/app/layout.tsx` for titles and section headings.
  - Inter / Plus Jakarta Sans for UI text, plot summaries, and buttons.
- **Strict Constraint:** No emojis anywhere in UI text, headings, badges, or buttons. All indicators use clean Lucide SVG icons or crisp typographic tags.

---

## 4. Error Handling & Edge Cases

1. **Pre-Flight Network Blocks:** If an adblocker blocks the probe `fetch()`, the error is caught silently and falls back directly to `111movies` without halting playback.
2. **Missing Media Titles / Logos:** Preserves the existing `logoFailed` fallback, rendering an uppercase `Bebas Neue` styled title if TMDB logo graphics are missing.
3. **Missing Trailers:** Hero banners and detail pages retain the poster fallback.
4. **Iframe Attributes:** Avoids standalone restrictive `sandbox` attributes on Filmu iframes to ensure standard storage access for its player.

---

## 5. Verification Plan

1. **TypeScript & Build Verification:** Run `npm run build` to verify 0 TS errors and successful Next.js static generation.
2. **Player Pre-Flight Test:** Verify on `/watch/movie/550` that the probe runs and selects a server, and that switching between 111movies and Filmu functions with zero errors.
3. **Anime & K-Drama Pages Test:** Verify `/anime` and `/kdrama` load proper TMDB titles, posters, and link to playback correctly.
4. **Git Commit & Push:** Ensure all changes are committed and pushed cleanly to `main` for Vercel deployment.
