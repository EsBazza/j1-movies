# 🍿 J1 Movies — Complete Project Architecture & Documentation

> **Version:** 1.0.0  
> **Last Updated:** September 5, 2026  
> **Framework:** Next.js 16 (App Router & Turbopack) with React 19 & Tailwind CSS v4

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Architecture & Directory Structure](#3-architecture--directory-structure)
4. [Video Streaming & Player Engine](#4-video-streaming--player-engine)
5. [TMDB Metadata & Secure API Proxy](#5-tmdb-metadata--secure-api-proxy)
6. [User State & Local Storage Architecture](#6-user-state--local-storage-architecture)
7. [UI & Component Design Suite](#7-ui--component-design-suite)
8. [Available Pages & Routing](#8-available-pages--routing)
9. [Keyboard Shortcuts & Accessibility](#9-keyboard-shortcuts--accessibility)
10. [Environment Variables & Setup Guide](#10-environment-variables--setup-guide)
11. [Deployment Guide](#11-deployment-guide)

---

## 1. Project Overview

**J1 Movies** is a personal cinema discovery and high-definition video streaming web application. It combines metadata from **The Movie Database (TMDB)** with a multi-server streaming infrastructure to provide fast loading times, subtitle support, zero-database local storage, and a dark luxury cinema user interface.

### Key Highlights:
- **Instant Playback (~350ms):** High-speed streaming servers with built-in multi-language subtitles and multi-audio tracks.
- **Custom ArtPlayer.js Engine:** Native HTML5 player with HLS (`.m3u8`) streaming, custom subtitle sync delay slider (`-5.0s` to `+5.0s`), font styling, and manual `.srt`/`.vtt` file uploader.
- **Zero-Database Privacy:** Watchlist, watch history with auto-resume points, and custom user folders saved directly in browser `localStorage`.
- **1-Click Backup & Restore:** Export and import user libraries across devices via standard JSON.
- **Dark Luxury Cinema Aesthetic:** Glassmorphism UI, glowing ambient ambilight backlighting, theater mode (`21:9`), and keyboard shortcuts.

---

## 2. Tech Stack & Dependencies

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) | Server-side rendering, API route handlers, optimized routing |
| **UI Library** | [React 19](https://react.dev/) | Component architecture, hooks, and `useSyncExternalStore` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Dark cinema theme, glassmorphism, responsive grid layouts |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible vector icons |
| **Player Engine** | [ArtPlayer.js](https://artplayer.org/) + [hls.js](https://github.com/video-dev/hls.js/) | Custom HTML5 player for direct HLS (`.m3u8`) streams & subtitles |
| **Metadata** | [TMDB API](https://www.themoviedb.org/) | Movies, TV series, cast filmographies, genres, and artwork |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) | Strict type safety across components and APIs |

---

## 3. Architecture & Directory Structure

```
j1-movies/
├── docs/                               # Project documentation & architecture specs
│   ├── superpowers/                    # Design specs and implementation plans
│   └── PROJECT_DOCUMENTATION.md        # Comprehensive technical documentation
├── public/                             # Static placeholders and assets
│   ├── placeholder-backdrop.svg
│   └── placeholder-poster.svg
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── api/
│   │   │   ├── stream/[...path]/       # Stream and subtitle resolver route
│   │   │   ├── superembed/             # SuperEmbed VIP customized route handler
│   │   │   └── tmdb/[...path]/         # Secure TMDB API caching proxy
│   │   ├── details/[type]/[id]/        # Rich Media Details page
│   │   ├── genre/[id]/                 # Genre-filtered media discovery
│   │   ├── movies/                     # Movies catalog with advanced discovery filters
│   │   ├── tv/                         # TV Series catalog with advanced discovery filters
│   │   ├── person/[id]/                # Actor/Director filmography & biography
│   │   ├── search/                     # Real-time multi-search (movies, TV, people)
│   │   ├── watch/[type]/[id]/          # Dedicated Cinema Streaming Player page
│   │   ├── watchlist/                  # User Library (Watchlist, History, Collections)
│   │   ├── layout.tsx                  # Root layout with Navbar, Footer, MobileNav
│   │   └── page.tsx                    # Landing page with hero banner & carousels
│   ├── components/
│   │   ├── common/                     # AdvancedFilterDrawer, BookmarkButton, SearchBar
│   │   ├── layout/                     # Navbar, MobileNav, Footer
│   │   ├── media/                      # HeroBanner, MediaCard, MediaCarousel, QuickPreviewModal, CastList
│   │   ├── player/                     # UnifiedCinemaPlayer, ArtPlayerCinema, EpisodeDrawer
│   │   └── ui/                         # Badges, Modals, Skeleton Loaders
│   ├── lib/
│   │   ├── tmdb.ts                     # TMDB API client & data normalization
│   │   ├── store.ts                    # useUserStore with useSyncExternalStore + localStorage
│   │   ├── playerSources.ts            # Streaming server cluster configuration
│   │   ├── videasy.ts                  # Videasy embed URL builder
│   │   └── utils.ts                    # Date, time, currency, and classname utilities
│   └── types/
│       └── tmdb.d.ts                   # TypeScript interfaces for TMDB data models
├── package.json
└── tsconfig.json
```

---

## 4. Video Streaming & Player Engine

The playback system uses a **Hybrid Cinema Architecture** managed by [`UnifiedCinemaPlayer.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/player/UnifiedCinemaPlayer.tsx):

```mermaid
flowchart TD
    A[Watch Page /watch/type/id] --> B[UnifiedCinemaPlayer Controller]
    
    B --> C{Active Server Selection}
    C -->|Server 1: VidLink Fast HD| D[VidLink Stream Engine - 350ms, Subtitles]
    C -->|Server 2: SuperEmbed VIP| E[/api/superembed Route - Custom Themed VIP]
    C -->|Server 3: Videasy HD| F[Videasy Stream Engine - Clean Player]
    C -->|Server 4: SmashyStream CDN| G[SmashyStream Backup CDN]
    C -->|Direct Stream ArtPlayer| H[ArtPlayer.js + HLS.js Engine]
    
    H --> I[Multi-Language Subtitle Selector]
    H --> J[Subtitle Delay Sync Slider -5s to +5s]
    H --> K[Custom .srt / .vtt File Upload]
    H --> L[Auto-Resume Watch Progress]
```

### 4.1 Streaming Server Cluster ([`src/lib/playerSources.ts`](file:///C:/Users/admin/Desktop/j1%20movies/src/lib/playerSources.ts))

| Server | Provider | Latency | Subtitle Support | Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **Server 1** | **VidLink Fast HD** | **~350ms** | ✅ **Full Suite (10+ Languages)** | Default server. Auto-subtitles, crimson `#e50914` theme, autoplay. |
| **Server 2** | **SuperEmbed VIP** | **~450ms** | ⚠️ Custom URL parameter | Custom J1 Movies theme, dark `#07090e` background, multi-quality HLS. |
| **Server 3** | **Videasy HD** | **~600ms** | ✅ Multi-Language | Clean, reliable cinema fallback with native controls. |
| **Server 4** | **SmashyStream CDN** | **~640ms** | ⚠️ English on select hosts | Backup CDN server. |

### 4.2 Custom ArtPlayer.js Engine ([`src/components/player/ArtPlayerCinema.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/player/ArtPlayerCinema.tsx))
- **HLS.js Buffer Tuning:** `maxBufferLength: 30`, `maxMaxBufferLength: 600`, worker enabled for smooth playback without drops.
- **Subtitle Suite:**
  - Real-time subtitle sync timing slider (`-5.0s` to `+5.0s` in `0.1s` increments).
  - Font sizing: Small (18px), Standard (24px), Large (30px), Extra Large (36px).
  - Custom file uploader: Drag & drop or upload local `.srt` / `.vtt` subtitles directly into the running stream.
- **Watch History Synchronization:** Automatically tracks playback timestamps and saves progress to local storage every 5 seconds.

### 4.3 SuperEmbed VIP Route Handler ([`src/app/api/superembed/route.ts`](file:///C:/Users/admin/Desktop/j1%20movies/src/app/api/superembed/route.ts))
Replaces the traditional PHP `se_player.php` script with a Next.js server route that applies custom brand styling (`player_primary_color=e50914`, `player_bg_color=07090e`, `player_font=Inter`, `player_loader=1`) and redirects to the VIP player instance.

---

## 5. TMDB Metadata & Secure API Proxy

Client requests do not expose API tokens directly to the browser. Instead, all requests route through the Next.js API Proxy:

### Proxy Route: [`/api/tmdb/[...path]/route.ts`](file:///C:/Users/admin/Desktop/j1%20movies/src/app/api/tmdb/%5B...path%5D/route.ts)
- **Security:** Injects `TMDB_API_KEY` or `TMDB_READ_ACCESS_TOKEN` on the server.
- **Edge Caching:** Sets `Cache-Control: public, s-maxage=86400, stale-while-revalidate=86400` for movie/show details, and `s-maxage=3600` for trending and discovery feeds.

### Data Normalizer: [`src/lib/tmdb.ts`](file:///C:/Users/admin/Desktop/j1%20movies/src/lib/tmdb.ts)
Standardizes varying TMDB payload structures across Movies, TV Series, Search, and Person filmographies into a unified `NormalizedMedia` interface.

---

## 6. User State & Local Storage Architecture

All user data is managed with **zero external databases or logins required**, powered by React 19's `useSyncExternalStore` in [`src/lib/store.ts`](file:///C:/Users/admin/Desktop/j1%20movies/src/lib/store.ts):

### Features:
1. **Watchlist:** Bookmark titles for later viewing.
2. **Watch History:** Tracks watched movies and TV series with season/episode numbers and timestamps. Capped at the latest 50 items.
3. **Custom Collections:** Create custom playlists/folders (e.g. *"Marvel Marathon"*, *"Anime Classics"*).
4. **1-Click JSON Backup & Restore:**
   - **Export:** Downloads a clean `j1-movies-backup-YYYY-MM-DD.json` file.
   - **Restore:** Uploads a JSON backup to restore watch history, watchlist, and collections to any browser or device.

---

## 7. UI & Component Design Suite

- **Ambient Ambilight Backlight:** Multi-color glow halo behind video players and hero banners.
- **Theater Mode:** Switches player to an ultrawide `21:9` view with dimmed page background.
- **TV Episode Drawer ([`EpisodeDrawer.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/player/EpisodeDrawer.tsx)):** Season switcher dropdown, episode stills, episode numbers, and descriptions with 1-click playback.
- **Quick Preview Modal ([`QuickPreviewModal.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/media/QuickPreviewModal.tsx)):** Netflix-style modal to watch official YouTube trailers and view synopses without leaving the browse view.
- **Advanced Filter Drawer ([`AdvancedFilterDrawer.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/common/AdvancedFilterDrawer.tsx)):** Filter catalog items by release era/year, minimum TMDB rating, and original language/region.

---

## 8. Available Pages & Routing

| Route | Component / Page | Purpose |
| :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Home page with Hero spotlight, Continue Watching row, and categorized carousels |
| `/movies` | `src/app/movies/page.tsx` | Movies discovery catalog with genre pills, sorting, and advanced filters |
| `/tv` | `src/app/tv/page.tsx` | TV Series discovery catalog with genre pills and advanced filters |
| `/details/[type]/[id]` | `src/app/details/[type]/[id]/page.tsx` | Full details page: synopsis, trailer popup, cast list, seasons/episodes, recommendations |
| `/watch/[type]/[id]` | `src/app/watch/[type]/[id]/page.tsx` | Dedicated Cinema Streaming Player with server switcher & episode drawer |
| `/person/[id]` | `src/app/person/[id]/page.tsx` | Actor/Director biography and filmography sorted by popularity, rating, or release date |
| `/genre/[id]` | `src/app/genre/[id]/page.tsx` | Genre-specific catalog browsing |
| `/search` | `src/app/search/page.tsx` | Multi-search across movies, TV shows, and people |
| `/watchlist` | `src/app/watchlist/page.tsx` | User Library: Watchlist, Watch History, Custom Collections, and JSON Backup/Restore |

---

## 9. Keyboard Shortcuts & Accessibility

| Key | Context | Action |
| :--- | :--- | :--- |
| `F` | Watch Page / Player | Toggle Cinema Fullscreen |
| `T` | Watch Page / Player | Toggle Cinema Theater View (21:9) |
| `Space` / `K` | ArtPlayer Native | Play / Pause |
| `C` | ArtPlayer Native | Toggle Subtitles / Captions On / Off |
| `M` | ArtPlayer Native | Toggle Mute / Unmute |
| `Left / Right Arrows` | ArtPlayer Native | Seek Backward / Forward 10 seconds |
| `Up / Down Arrows` | ArtPlayer Native | Increase / Decrease Volume 10% |

---

## 10. Environment Variables & Setup Guide

### 1. Prerequisites
- Node.js `v18.18.0` or higher
- npm or pnpm

### 2. Configure Environment (`.env.local`)
Create a `.env.local` file in the root directory:
```env
# TMDB API Configuration (Get free key at https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_api_key_here
# OR
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token_here
```

### 3. Run Locally
```bash
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 11. Deployment Guide

### Deploying to Vercel
1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com/new).
3. In **Project Settings → Environment Variables**, add your `TMDB_API_KEY` (or `TMDB_READ_ACCESS_TOKEN`).
4. Click **Deploy**.

---

## 📄 License
This project is licensed under the MIT License.
