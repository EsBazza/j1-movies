# Design Spec: Image Optimization & Player Ad-Shield for J1 Movies

- **Date**: 2026-09-23
- **Topic**: Image Optimization (Vercel Quota Mitigation) & Player Ad-Shield
- **Status**: Approved

---

## 1. Problem Statement

1. **Vercel Image Transformation Quota Exhaustion**:
   - The user's Vercel deployment hit **5,140 Image Transformations (97.4%+)** against the 5,000 monthly quota.
   - Next.js default `<Image>` component transforms images server-side through `/_next/image`, counting every unique image resolution and viewport combination as an billable transformation.
   - While commit `d3c0e8c` introduced `images: { unoptimized: true }` in `next.config.ts`, existing backdrops loaded via TMDB still defaulted to `original` (4K, ~5-10MB files), and static logo/icon files in `public/` weighed 427KB each.
   - The Vercel usage dashboard maintains a cumulative 30-day billing total; resolving this permanently requires verifying zero-transformation direct CDN routing, right-sizing TMDB image resolution buckets, and compressing local assets.

2. **Player Popups and Intrusive Ads**:
   - Third-party streaming servers (`111movies` and `Filmu`) embedded via `<iframe>` in `src/app/watch/[type]/[id]/page.tsx` generate unwanted new-tab popups (`window.open`) and page redirects (`window.top.location`) upon interaction.
   - The player currently has no sandbox or popup mitigation attributes.

---

## 2. Architecture & Design

### 2.1. Zero-Transformation Image Pipeline

1. **Vercel Image Optimization Bypass**:
   - Ensure `next.config.ts` maintains `images: { unoptimized: true }`.
   - All `<Image>` invocations compile directly to standard HTML `<img>` elements pointing directly to TMDB's CDN or local `/public` assets.
   - No requests hit `/_next/image`, permanently guaranteeing **0 Vercel Image Transformations**.

2. **TMDB Resolution Buckets (`src/lib/tmdb.ts`)**:
   - Standardize `getBackdropUrl`:
     - Default size changed from `original` to `'w1280'` (1280px width, ~150-250KB, reducing payload by ~80% while retaining high quality on desktop displays).
     - Ambient background glows and color extractors standardise on `'w780'` or `'w300'`.
   - Standardize `getPosterUrl`:
     - Cards use `'w500'` or `'w342'`.
   - Standardize `getImageUrl`:
     - Episode still thumbnails use `'w300'`.
     - Cast profiles use `'w185'`.

3. **Static Asset Optimization (`public/`)**:
   - Compress `logo.png`, `favicon.png`, `icon.png`, and `favicon.ico` from 427KB to optimized PNG/WebP assets under 40KB.

---

### 2.2. Multi-Layer Player Ad-Shield

1. **HTML5 Iframe Sandboxing**:
   - Apply sandboxing to the video player iframe in `src/app/watch/[type]/[id]/page.tsx`:
     ```html
     sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
     ```
   - **Allowed**:
     - `allow-scripts`: Required for player UI controls, HLS video stream parsing, audio controls, and subtitle rendering.
     - `allow-same-origin`: Allows the player to access media blobs, cookies, and tokens needed for playback.
     - `allow-forms`: Permits quality selector drop-downs and interactive controls.
     - `allow-presentation`: Enables full-screen, picture-in-picture, and cast modes.
   - **Blocked**:
     - Omission of `allow-popups`: Prevents the player from opening new tabs or spam ad popups on click.
     - Omission of `allow-popups-to-escape-sandbox`: Prevents nested ad scripts from breaking out.
     - Omission of `allow-top-navigation` and `allow-top-navigation-by-user-activation`: Blocks malware redirects from hijacking the main browser tab.

2. **Ad-Shield User Toggle & Resilience**:
   - Provide an **"Ad Shield" pill** in the top cinema navigation bar with states:
     - `Shield Active` (default): Strict sandbox applied (`allow-scripts allow-same-origin allow-forms allow-presentation`).
     - `Shield Relaxed`: Standard sandbox including `allow-popups` as a safety valve in case a specific mirror or stream requires popup interaction.
   - Persist user preference in `useUserStore` (localStorage).
   - Display a clean UI badge indicating "Shield Active: 0 Ads & Popups Blocked".

---

## 3. Data Flow & State Management

```
User visits J1 Movies
       │
       ├── Image Loading:
       │    ├── Next.js <Image> (unoptimized: true)
       │    ├── Direct fetch: image.tmdb.org/t/p/w1280 (Backdrop)
       │    ├── Direct fetch: image.tmdb.org/t/p/w500 (Poster)
       │    └── Direct fetch: /logo.png (30KB compressed local asset)
       │    └── Result: 0 Vercel Transformations consumed
       │
       └── Watch Player:
            ├── User selects Movie/Episode
            ├── Iframe mounts with sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            ├── Video stream (HLS) plays smoothly
            └── Popups & redirects blocked silently by browser sandbox
```

---

## 4. Error Handling & Edge Cases

- **Strict Sandbox Playback Failure**: If a stream provider detects sandbox restrictions and refuses to load, the user can toggle "Ad Shield" to Relaxed mode directly in the player bar without page reload.
- **Image Fallbacks**: Retain existing `onError` fallbacks in `MediaCard` and `HeroBanner` so missing posters cleanly fallback to backdrops or SVG placeholders without breaking layout.
- **TMDB Rate Limiting**: TMDB CDN images are hosted on Cloudflare with unlimited requests; bypassing Vercel removes any third-party quota bottleneck.

---

## 5. Verification Plan

1. **Build Verification**: Run `npm run build` to confirm zero build errors or TypeScript issues.
2. **HTML Image Source Verification**: Inspect generated HTML and client DOM to ensure `img.src` points directly to `https://image.tmdb.org/...` with no `/_next/image` proxy references.
3. **Asset Size Verification**: Confirm `logo.png` and favicon assets are reduced from 427KB down to < 50KB.
4. **Player Ad-Shield Verification**:
   - Open `/watch/movie/...` and verify the video iframe loads and plays with `sandbox` active.
   - Verify that clicking anywhere within the player does not trigger popup tabs or top-level redirects.
   - Verify the Ad-Shield toggle switches modes dynamically and persists state.
