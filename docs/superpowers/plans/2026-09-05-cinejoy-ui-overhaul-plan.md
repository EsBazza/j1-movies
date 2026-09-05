# 🚀 Implementation Plan: CineJoy / Apple TV+ Luxury UI Overhaul

- **Date:** 2026-09-05
- **Design Spec:** [2026-09-05-cinejoy-ui-overhaul-design.md](../specs/2026-09-05-cinejoy-ui-overhaul-design.md)
- **Status:** Ready for Execution

---

## 📋 Task Checklist

- [ ] **Task 1: Add Helper Utilities in `src/lib/utils.ts`**
  - Add `formatEndTime(runtimeMinutes: number): string` to calculate finish time (e.g. `1h 46m • Ends 7:32 PM`).
  - Add `formatCurrency(amount: number): string` for budget & revenue (e.g. `$7,500,000`).
  - Add `formatDateFull(dateStr: string): string` for release dates (e.g. `Jul 1, 2016`).

- [ ] **Task 2: Build Floating Glass Pill Navbar (`src/components/layout/Navbar.tsx`)**
  - Left: Minimal back navigation and brand logo.
  - Right: Floating glassmorphism pill capsule (`Home`, `Movies`, `Shows`, `My List`, `🔍 Search`).
  - Transparent blur styling with active route indicators.

- [ ] **Task 3: Build Seamless Borderless Footer (`src/components/layout/Footer.tsx`)**
  - Remove hard horizontal borders and division lines.
  - Create smooth gradient fade from page content into minimal centered logo, disclaimer, and quick links.

- [ ] **Task 4: Upgrade Cast Showcase to Circular Avatars (`src/components/media/CastList.tsx`)**
  - Convert rectangular cards into circular headshot avatars (`rounded-full aspect-square`).
  - Display actor name in bold white and character name in subtitle.
  - Smooth horizontal scroll container.

- [ ] **Task 5: Redesign Details Page (`src/app/details/[type]/[id]/page.tsx`)**
  - Add **Auto-playing Background YouTube Trailer** with muted loop and interactive **🔊 Mute/Unmute toggle button**.
  - Add **Dynamic Ambient Color Grading** using blurred backdrop layering and radial mood lighting.
  - Add **White Capsule ▶ Play Button** and circular action buttons.
  - Add **Director byline** and content rating badges.
  - Add **Right-Side Cinema Stats Panel** (Runtime with end-time, Language, Release Date, Budget, Revenue, Production Companies).
  - Add **"Trailers & Clips" Multi-Video Grid** with 1-click modal video player.
  - Retain TV season & episode selector and "You Might Also Like" recommendation carousel.

- [ ] **Task 6: Build Verification & Testing**
  - Run `npm run build` to verify clean TypeScript compilation and Turbopack bundling.
  - Verify layout across desktop and mobile screens.
