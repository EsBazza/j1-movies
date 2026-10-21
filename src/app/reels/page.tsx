'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { discoverMedia, getTrailerKey, getTrending, normalizeMediaItem } from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { ReelItem } from '@/components/reels/ReelItem';
import { Chip } from '@/components/ui/Chip';
import { VolumeControl } from '@/components/ui/VolumeControl';
import { setTrailerMuted, useTrailerMuted } from '@/lib/youtube';

interface Feed {
  id: string;
  label: string;
  load: (page: number) => Promise<NormalizedMedia[]>;
}

const discover = (mediaType: 'movie' | 'tv', extra: Partial<Parameters<typeof discoverMedia>[0]>) => async (page: number) => {
  const res = await discoverMedia({ mediaType, sortBy: 'popularity.desc', minVotes: 80, page, ...extra });
  return (res.results || []).map((r) => normalizeMediaItem(r, mediaType));
};

const FEEDS: Feed[] = [
  {
    id: 'trending',
    label: 'Trending',
    load: async (page) => {
      const res = await getTrending('all', 'week');
      // Trending has no paging in our helper; later pages fall back to popular movies
      if (page === 1) return (res.results || []).filter((r) => r.media_type !== ('person' as string)).map((r) => normalizeMediaItem(r));
      return discover('movie', {})(page - 1);
    },
  },
  { id: 'action', label: 'Action', load: discover('movie', { genreId: 28 }) },
  { id: 'comedy', label: 'Comedy', load: discover('movie', { genreId: 35 }) },
  { id: 'horror', label: 'Horror', load: discover('movie', { genreId: 27 }) },
  { id: 'scifi', label: 'Sci-Fi', load: discover('movie', { genreId: 878 }) },
  { id: 'series', label: 'Series', load: discover('tv', {}) },
  { id: 'anime', label: 'Anime', load: discover('tv', { genreId: 16, withOriginalLanguage: 'ja' }) },
  { id: 'kdrama', label: 'K-Drama', load: discover('tv', { withOriginalLanguage: 'ko' }) },
];

const SEEN_KEY = 'j1-seen-reels';
const SEEN_LIMIT = 400;

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markSeen(key: string) {
  try {
    const next = [key, ...readSeen().filter((k) => k !== key)].slice(0, SEEN_LIMIT);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable
  }
}

const keyOf = (m: NormalizedMedia) => `${m.type}-${m.id}`;
const PREFETCH_AHEAD = 3;

export default function ReelsPage() {
  const [feedId, setFeedId] = useState(FEEDS[0].id);
  const [items, setItems] = useState<NormalizedMedia[]>([]);
  // undefined = not resolved yet, null = no trailer (item gets dropped)
  const [trailers, setTrailers] = useState<Record<string, string | null>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  // Incremented on every feed switch; responses from an older feed are discarded
  const feedTokenRef = useRef(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isMuted = useTrailerMuted();

  const feed = FEEDS.find((f) => f.id === feedId) ?? FEEDS[0];

  const loadMore = useCallback(
    async (reset = false) => {
      if (reset) {
        feedTokenRef.current += 1;
        hasMoreRef.current = true;
      } else if (loadingRef.current || !hasMoreRef.current) {
        return;
      }
      const token = feedTokenRef.current;
      loadingRef.current = true;
      setIsLoading(true);
      const page = reset ? 1 : pageRef.current;
      try {
        const results = await feed.load(page);
        if (token !== feedTokenRef.current) return;
        // An empty page means we've reached the end of this feed — stop asking
        if (results.length === 0) hasMoreRef.current = false;
        const seen = new Set(readSeen());
        const fresh = results.filter((m) => m.backdropPath && m.posterPath);
        // Prefer unseen titles; if everything was seen, show them again rather than nothing
        const unseen = fresh.filter((m) => !seen.has(keyOf(m)));
        const batch = unseen.length >= 4 ? unseen : fresh;
        pageRef.current = page + 1;
        setItems((prev) => {
          const base = reset ? [] : prev;
          const known = new Set(base.map(keyOf));
          return [...base, ...batch.filter((m) => !known.has(keyOf(m)))];
        });
      } catch {
        // keep current feed; the next scroll retries
      } finally {
        if (token === feedTokenRef.current) {
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [feed]
  );

  // New feed: reset and load the first page
  useEffect(() => {
    setItems([]);
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ top: 0 });
    loadMore(true);
  }, [loadMore]);

  // Only titles that actually have a trailer stay in the feed
  const playable = useMemo(() => items.filter((m) => trailers[keyOf(m)] !== null), [items, trailers]);

  // Resolve trailers for the active reel and the next few
  useEffect(() => {
    const upcoming = playable.slice(activeIndex, activeIndex + PREFETCH_AHEAD + 1);
    upcoming.forEach((m) => {
      const key = keyOf(m);
      if (key in trailers) return;
      getTrailerKey(m.type, m.id).then((t) => setTrailers((prev) => (key in prev ? prev : { ...prev, [key]: t })));
    });
    if (playable.length - activeIndex < 6) loadMore();
  }, [activeIndex, playable, trailers, loadMore]);

  // Track which reel is on screen
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.reelIndex);
            if (!Number.isNaN(index)) setActiveIndex(index);
          }
        }
      },
      { root, threshold: 0.6 }
    );
    root.querySelectorAll('[data-reel-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [playable.length]);

  useEffect(() => {
    const m = playable[activeIndex];
    if (m) markSeen(keyOf(m));
  }, [activeIndex, playable]);

  const scrollToIndex = useCallback((index: number) => {
    if (index < 0) return;
    const el = scrollerRef.current?.querySelector(`[data-reel-index="${index}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard: ↑/↓ or J/K to move, M to mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowdown' || key === 'j') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (key === 'arrowup' || key === 'k') {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (key === 'm') {
        setTrailerMuted(!isMuted);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, isMuted, scrollToIndex]);

  return (
    <div className="fixed inset-0 z-[var(--z-nav)] bg-black">
      <h1 className="sr-only">Reels: trailers feed</h1>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-30 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 px-4 sm:px-8">
          <Link href="/" aria-label="Back to home" className="flex items-center gap-2 text-white flex-shrink-0">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <Image src="/logo.png" alt="" width={90} height={24} className="h-6 w-auto hidden sm:block" />
          </Link>
          <div className="flex flex-1 min-w-0 gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Feed">
            {FEEDS.map((f) => (
              <Chip key={f.id} selected={f.id === feedId} onClick={() => setFeedId(f.id)} className="bg-black/40 backdrop-blur-sm">
                {f.label}
              </Chip>
            ))}
          </div>
          <VolumeControl size="md" className="flex-shrink-0 bg-black/40" />
        </div>
      </div>

      {/* Up / down for mouse users (touch scrolls natively) */}
      <div className="hidden [@media(hover:hover)_and_(pointer:fine)]:flex absolute z-30 right-6 top-1/2 -translate-y-1/2 flex-col gap-3">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous trailer"
          title="Previous (↑ / K)"
          className="w-12 h-12 rounded-full bg-white/12 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition-[background-color,opacity,transform] active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronUp className="w-6 h-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex >= playable.length - 1}
          aria-label="Next trailer"
          title="Next (↓ / J)"
          className="w-12 h-12 rounded-full bg-white/12 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition-[background-color,opacity,transform] active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronDown className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-contain"
        aria-label="Trailers"
      >
        {playable.map((m, i) => (
          <ReelItem
            key={keyOf(m)}
            item={m}
            index={i}
            isActive={i === activeIndex}
            trailerKey={trailers[keyOf(m)] ?? null}
            onEnded={() => scrollToIndex(i + 1)}
          />
        ))}
        {(isLoading || playable.length === 0) && (
          <div className="h-full snap-start flex items-center justify-center" role="status">
            <Loader2 className="w-8 h-8 animate-spin text-white/70" aria-label="Loading trailers" />
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {playable[activeIndex] ? `Now playing: ${playable[activeIndex].title}` : ''}
      </p>
    </div>
  );
}
