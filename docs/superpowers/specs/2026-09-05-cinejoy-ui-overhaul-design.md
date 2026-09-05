# 🎬 Design Specification: CineJoy / Apple TV+ Luxury Cinema UI Overhaul

- **Date:** 2026-09-05
- **Status:** Approved / In Review
- **Inspiration:** CineJoy / Apple TV+ Modern Streaming Interface

---

## 1. Executive Summary

J1 Movies is upgrading its user interface to an ultra-modern, cinematic luxury design inspired by CineJoy and Apple TV+. The overhaul includes an **auto-playing ambient background trailer hero with mute/unmute toggle**, **dynamic movie-specific ambient color grading**, **right-side cinema stats panel** (runtime end-time, budget, revenue, studios), **circular cast avatars**, **multi-trailer video gallery**, a **seamlessly blended borderless footer**, and a **floating glass pill navigation bar**.

---

## 2. Core Feature Specifications

### 2.1 Auto-Playing Background Trailer Hero
- **Ambient YouTube Layer:** Plays the primary official YouTube trailer muted on loop behind the hero.
- **Dynamic Backdrop Fallback:** If no video trailer is available, displays the high-res backdrop with dynamic color tinting.
- **Audio Control:** Interactive `🔊 Mute / Unmute` button on the hero action bar.
- **Vignette & Gradient Overlay:** Subtle dark cinematic gradients to ensure high text contrast and legibility.

### 2.2 Dynamic Movie Color Grading
- The ambient background glow and page mood dynamically tints to match the movie's primary backdrop / poster color palette (e.g., deep purples/cyans for anime, warm amber for dramas, crimson for action/thrillers) using blurred backdrop layers and soft radial lighting.

### 2.3 Hero Information & Action Block
- **Title / Artwork:** Clean typography or official logo graphic.
- **Genre Chips:** `Animation • Romance • Drama` bulleted genre list.
- **Action Buttons:**
  - **▶ Play:** High-contrast white capsule button with black text.
  - **➕ Add to My List:** Circular bookmark button with active toggle.
  - **🔊 Audio Toggle:** Speaker icon to listen to the background trailer.
- **Metadata Badges:** Release Year, Runtime, Content Rating (`PG`, `PG-13`, `R`, `TV-MA`), and TMDB Score (`★ 8.5`).
- **Director Byline:** `"Director: Makoto Shinkai"` with clickable link to director filmography.
- **Synopsis:** Multi-line synopsis with expandable `"Read More"` toggle.

### 2.4 Cinema Stats Sidebar (Right-Side Panel)
- **Runtime & Live Finish Time:** E.g. `1h 46m • Ends 7:32 PM` (calculated from user's current clock).
- **Language Code:** Formatted language (e.g. `JA`, `EN`, `KO`).
- **Release Date:** Formatted full release date (e.g. `Jul 1, 2016`).
- **Financial Box Office:** Formatted budget (`$7,500,000`) and global box office revenue (`$407,210,429`).
- **Production Studios:** Studio badges and logos.

### 2.5 Circular Cast Headshots Row
- Circular round avatar headshots (`aspect-square rounded-full border border-white/10`).
- Actor name (bold white) and character name / voice role below.
- Smooth horizontal scroll container with links to `/person/[id]`.

### 2.6 "Trailers & Clips" Multi-Video Gallery
- Grid of all official trailers, teasers, and clips from TMDB.
- Video thumbnails with official labels and 1-click modal video playback.

### 2.7 Seamless Blended Footer
- Zero hard dividing borders or horizontal divider lines.
- Smoothly fades from the recommendation section into clean centered branding and links.

### 2.8 Floating Glass Pill Navigation Bar
- **Top Left:** Minimal back button `←` and brand logo.
- **Top Right:** Translucent glassmorphism pill capsule (`Home` | `Movies` | `Shows` | `My List` | `🔍 Search`).
- Mobile-responsive navigation.

---

## 3. Architecture & File Plan

1. **[`src/components/layout/Navbar.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/layout/Navbar.tsx):**
   - Refactor into floating glass pill navbar.
2. **[`src/app/details/[type]/[id]/page.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/app/details/%5Btype%5D/%5Bid%5D/page.tsx):**
   - Implement ambient background trailer, stats sidebar, dynamic color grading, and trailers grid.
3. **[`src/components/media/CastList.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/media/CastList.tsx):**
   - Update to circular avatar headshots with actor & character name.
4. **[`src/components/layout/Footer.tsx`](file:///C:/Users/admin/Desktop/j1%20movies/src/components/layout/Footer.tsx):**
   - Update to seamless borderless footer.
5. **[`src/lib/utils.ts`](file:///C:/Users/admin/Desktop/j1%20movies/src/lib/utils.ts):**
   - Add `formatEndTime` (calculates e.g. "Ends 7:32 PM" based on runtime) and `formatCurrency`.
