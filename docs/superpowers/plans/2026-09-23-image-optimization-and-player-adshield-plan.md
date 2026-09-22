# 🚀 Implementation Plan: Image Optimization & Player Ad-Shield

- **Date:** 2026-09-23
- **Design Spec:** [2026-09-23-image-optimization-and-player-adshield-design.md](../specs/2026-09-23-image-optimization-and-player-adshield-design.md)
- **Status:** Ready for Execution

---

## 📋 Task Checklist

- [ ] **Task 1: Next.js Configuration & Static Asset Caching**
  - Verify and keep `images: { unoptimized: true }` in `next.config.ts`.
  - Add explicit immutable caching headers for static assets (`/logo.png`, `/favicon.png`, `/icon.png`, SVGs) in `next.config.ts`.

- [ ] **Task 2: TMDB Image Resolution Tuning (`src/lib/tmdb.ts`)**
  - In `src/lib/tmdb.ts`:
    - Update `getBackdropUrl(path, size = 'w1280')`: change default size from `original` (4K) to `'w1280'`.
    - Update `getPosterUrl`: verify standard sizing (`w500` / `w342`).
    - Update `getImageUrl`: optimize default size to prevent requesting uncompressed raw originals.
  - Review all call sites across `HeroBanner.tsx`, `details/page.tsx`, and `watch/page.tsx` that explicitly passed `'original'` and switch them to `'w1280'` or `'w780'` for fast loading.

- [ ] **Task 3: Local Asset Compression**
  - Compress `public/logo.png`, `public/favicon.png`, `public/icon.png`, and `src/app/icon.png` (currently ~427 KB each) to lightweight, optimized WebP/PNG assets under 40 KB without visual loss.

- [ ] **Task 4: Multi-Layer Player Ad-Shield (`src/lib/store.ts` & `src/app/watch/[type]/[id]/page.tsx`)**
  - In `src/lib/store.ts`:
    - Add `adShieldEnabled: boolean` (default `true`) and `setAdShieldEnabled: (val: boolean) => void` to Zustand state with persistence.
  - In `src/app/watch/[type]/[id]/page.tsx`:
    - Add HTML5 `sandbox` attribute to the video player `<iframe>`:
      - When `adShieldEnabled === true`: `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`.
      - When `adShieldEnabled === false`: `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox"`.
    - Add an "Ad Shield" interactive pill toggle to the top cinema control bar next to the server switcher:
      - Clean green/red shield icon (`ShieldCheck` / `ShieldAlert` from `lucide-react`).
      - Tooltip/badge showing "Ad Shield: Active (0 Popups)" vs "Ad Shield: Relaxed".
      - One-click toggle that updates state immediately.

- [ ] **Task 5: End-to-End Verification & Build**
  - Run `npm run build` to ensure 0 TypeScript or build errors.
  - Check rendered DOM to verify images load with direct `src` attributes (0 Vercel transformations).
  - Verify player loads with sandbox attributes and popups are neutralized.
  - Commit all changes and verify clean git status.
