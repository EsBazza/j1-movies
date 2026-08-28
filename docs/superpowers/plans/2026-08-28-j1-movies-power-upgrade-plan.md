# J1 Movies - Power Upgrade Implementation Plan

**Spec Reference:** [`docs/superpowers/specs/2026-08-28-j1-movies-power-upgrade-design.md`](file:///C:/Users/admin/Desktop/j1%20movies/docs/superpowers/specs/2026-08-28-j1-movies-power-upgrade-design.md)  
**Date:** 2026-08-28  

---

## Phase 1: Multi-Server Streaming Engine
- [ ] Create `src/lib/playerSources.ts` with streaming provider definitions (Videasy, VidLink, Vidsrc VIP, AutoEmbed).
- [ ] Update `src/components/player/VideasyPlayer.tsx` with multi-server switcher dropdown and server badges.
- [ ] Update `useUserStore` in `src/lib/store.ts` to persist user's preferred default server.

## Phase 2: Actor & Director Filmography Explorer
- [ ] Add Person TypeScript interfaces to `src/types/tmdb.d.ts` (`TMDBPersonDetails`, `TMDBCreditItem`).
- [ ] Add `getPersonDetails(id)` helper to `src/lib/tmdb.ts`.
- [ ] Build `/person/[id]/page.tsx` with biography, photos, department filters, sorting, and filmography grid.
- [ ] Update `src/components/media/CastList.tsx` to link each actor avatar to `/person/[id]`.

## Phase 3: Advanced Filter Suite
- [ ] Add advanced discover query builder support in `src/lib/tmdb.ts` (year ranges, min rating, language).
- [ ] Create `src/components/common/AdvancedFilterDrawer.tsx` with interactive sliders, era chips, rating pills, and language selectors.
- [ ] Integrate filter drawer into `/movies`, `/tv`, and `/genre/[id]`.

## Phase 4: Quick Preview Modal
- [ ] Create `src/components/media/QuickPreviewModal.tsx` with YouTube trailer embed, metadata, cast list, and quick stream action.
- [ ] Add quick preview eye/info trigger button on `MediaCard.tsx`.

## Phase 5: Custom Collections & JSON Backup
- [ ] Expand `src/lib/store.ts` with custom collections management and JSON export/import functions.
- [ ] Add "Custom Collections" tab and "Export / Import Backup" buttons in `src/app/watchlist/page.tsx`.

## Phase 6: Verification & Final Polish
- [ ] Test multi-server playback switching across movies and TV series.
- [ ] Test Actor filmography pages and cast avatar navigation.
- [ ] Test advanced filter combinations.
- [ ] Test JSON export and import restore flow.
- [ ] Run clean `npm run build` verification.
