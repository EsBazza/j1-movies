# 🚀 Implementation Plan: Custom ArtPlayer Cinema Streaming Engine & Subtitle Suite

- **Date:** 2026-09-05
- **Design Spec:** [2026-09-05-custom-artplayer-stream-engine-design.md](../specs/2026-09-05-custom-artplayer-stream-engine-design.md)
- **Status:** Ready for Execution

---

## 📋 Task Checklist

- [ ] **Task 1: Install Player Dependencies**
  - Install `artplayer` and `hls.js` (and `@types/hls.js` if necessary) via `npm install artplayer hls.js`.
  - Verify package.json and clean build configuration.

- [ ] **Task 2: Create Stream & Subtitles Resolver API Route**
  - Create `src/app/api/stream/[...path]/route.ts`.
  - Implement TMDB movie & TV episode stream extraction logic with multi-language subtitle parsing.
  - Return standardized `StreamResolutionResponse` schema with fallback readiness.

- [ ] **Task 3: Build Custom `ArtPlayerCinema` Component**
  - Create `src/components/player/ArtPlayerCinema.tsx`.
  - Initialize ArtPlayer with `hls.js` buffer tuning (`maxBufferLength: 30`, low-latency HLS).
  - Implement signature crimson theme (`#e50914`), custom controls, and ambient backlight.
  - Add real-time Subtitle Engine:
    - Multi-language track selector.
    - Subtitle delay sync slider (`-5.0s` to `+5.0s`).
    - Custom subtitle font styling & background opacity.
    - Manual `.vtt` / `.srt` file uploader.
  - Wire keyboard shortcuts (`Space`, `F`, `T`, `M`, `C`, arrow keys).
  - Sync playback timestamps with `useUserStore` for continuous watch history resume.

- [ ] **Task 4: Build `UnifiedCinemaPlayer` Wrapper Component**
  - Create `src/components/player/UnifiedCinemaPlayer.tsx`.
  - Add seamless server switching pill bar:
    - `⚡ Native HD (ArtPlayer)`
    - `Server 1 (Videasy HD)`
    - `Server 2 (VidLink Pro)`
    - `Server 3 (Vidsrc VIP)`
    - `Server 4 (AutoEmbed)`
  - Handle automatic fallback if native HLS stream is blocked or unavailable.

- [ ] **Task 5: Integrate with Watch Page (`/watch/[type]/[id]`)**
  - Update `src/app/watch/[type]/[id]/page.tsx` to replace the old player with `UnifiedCinemaPlayer`.
  - Verify theater mode, episode drawer for TV series, and media metadata card.

- [ ] **Task 6: Verification & Testing**
  - Test movies and TV series playback on Native ArtPlayer mode.
  - Test subtitle language switching, timing sync offset, and custom upload.
  - Test server switching to fallback embed servers.
  - Run Next.js lint / build test (`npm run build`) to ensure zero TypeScript/bundle errors.
