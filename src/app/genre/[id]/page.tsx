'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  getMoviesByGenre,
  getTVByGenre,
  getMovieGenres,
  getTVGenres,
  getBackdropUrl,
  normalizeMediaItem,
  sortMediaList,
} from '@/lib/tmdb';
import { NormalizedMedia, MediaType } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { HeroBanner } from '@/components/media/HeroBanner';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { PAGE_GUTTER } from '@/components/media/MediaCarousel';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { Chip } from '@/components/ui/Chip';
import { LoadMore } from '@/components/ui/LoadMore';
import { useReveal } from '@/lib/useReveal';
import { extractPaletteFromImage, getPaletteForGenre, ExtractedPalette } from '@/lib/colorExtractor';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';

// Static mapping fallback for popular TMDB genres
const GENRE_MAP: Record<string, string> = {
  '28': 'Action',
  '12': 'Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Science Fiction',
  '10770': 'TV Movie',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western',
  '10759': 'Action & Adventure',
  '10762': 'Kids',
  '10763': 'News',
  '10764': 'Reality',
  '10765': 'Sci-Fi & Fantasy',
  '10766': 'Soap',
  '10767': 'Talk',
  '10768': 'War & Politics',
};

const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10';

function GenreContent() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const genreId = (routeParams?.id as string) || '';
  const typeParam = (searchParams.get('type') as MediaType | 'all') || 'all';
  const sortParam = searchParams.get('sort_by') || 'popularity.desc';

  const [mediaType, setMediaType] = useState<MediaType | 'all'>(typeParam);
  const [sortBy, setSortBy] = useState<string>(sortParam);
  const [genreName, setGenreName] = useState<string>(GENRE_MAP[genreId] || 'Genre');
  const [items, setItems] = useState<NormalizedMedia[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [palette, setPalette] = useState<ExtractedPalette>(() => getPaletteForGenre(Number(genreId)));
  const gridRevealRef = useReveal<HTMLDivElement>();

  const handleActiveHeroChange = useCallback(
    (active: NormalizedMedia) => {
      const src = active.backdropPath || active.posterPath;
      if (src) extractPaletteFromImage(getBackdropUrl(src, 'w780'), Number(genreId)).then(setPalette);
    },
    [genreId]
  );

  const appendUnique = (incoming: NormalizedMedia[]) =>
    setItems((prev) => {
      const known = new Set(prev.map((m) => `${m.type}-${m.id}`));
      return [...prev, ...incoming.filter((m) => !known.has(`${m.type}-${m.id}`))];
    });

  // Fetch Genre Name
  useEffect(() => {
    if (!genreId) return;

    async function loadGenreName() {
      try {
        const [mRes, tRes] = await Promise.all([
          getMovieGenres().catch(() => ({ genres: [] })),
          getTVGenres().catch(() => ({ genres: [] })),
        ]);
        const allGenres = [...mRes.genres, ...tRes.genres];
        const match = allGenres.find((g) => String(g.id) === genreId);
        if (match) {
          setGenreName(match.name);
        }
      } catch (err) {
        console.error('Error fetching genre list:', err);
      }
    }
    loadGenreName();
  }, [genreId]);

  // Load Content for Genre
  useEffect(() => {
    if (!genreId) return;
    let ignore = false;

    async function loadGenreMedia() {
      setIsLoading(true);
      setPage(1);

      try {
        if (mediaType === 'movie') {
          const res = await getMoviesByGenre(genreId, 1, sortBy);
          if (ignore) return;
          const normalized = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
          setItems(normalized);
          setTotalPages(res.total_pages || 1);
        } else if (mediaType === 'tv') {
          const res = await getTVByGenre(genreId, 1, sortBy);
          if (ignore) return;
          const normalized = (res.results || []).map((t) => normalizeMediaItem(t, 'tv'));
          setItems(normalized);
          setTotalPages(res.total_pages || 1);
        } else {
          // Combined Movie & TV
          const [mRes, tRes] = await Promise.all([
            getMoviesByGenre(genreId, 1, sortBy).catch(() => ({ results: [], total_pages: 1 })),
            getTVByGenre(genreId, 1, sortBy).catch(() => ({ results: [], total_pages: 1 })),
          ]);
          if (ignore) return;

          const normMovies = (mRes.results || []).map((m) => normalizeMediaItem(m, 'movie'));
          const normTv = (tRes.results || []).map((t) => normalizeMediaItem(t, 'tv'));
          setItems(sortMediaList([...normMovies, ...normTv], sortBy));
          setTotalPages(Math.max(mRes.total_pages || 1, tRes.total_pages || 1));
        }
      } catch (err) {
        console.error('Failed to load genre media:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadGenreMedia();
    return () => {
      ignore = true;
    };
  }, [genreId, mediaType, sortBy]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore || !genreId) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      if (mediaType === 'movie') {
        const res = await getMoviesByGenre(genreId, nextPage, sortBy);
        const newItems = (res.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        appendUnique(newItems);
      } else if (mediaType === 'tv') {
        const res = await getTVByGenre(genreId, nextPage, sortBy);
        const newItems = (res.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        appendUnique(newItems);
      } else {
        const [mRes, tRes] = await Promise.all([
          getMoviesByGenre(genreId, nextPage, sortBy).catch(() => ({ results: [] })),
          getTVByGenre(genreId, nextPage, sortBy).catch(() => ({ results: [] })),
        ]);
        const newMovies = (mRes.results || []).map((m) => normalizeMediaItem(m, 'movie'));
        const newTv = (tRes.results || []).map((t) => normalizeMediaItem(t, 'tv'));
        appendUnique(sortMediaList([...newMovies, ...newTv], sortBy));
      }
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more genre media:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTypeChange = (newType: MediaType | 'all') => {
    setMediaType(newType);
    router.replace(`/genre/${genreId}?type=${newType}&sort_by=${sortBy}`);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    router.replace(`/genre/${genreId}?type=${mediaType}&sort_by=${newSort}`);
  };

  const featured = items.filter((m) => m.backdropPath && m.posterPath).slice(0, 5);

  return (
    <div className="flex flex-col w-full pb-28 lg:pb-16 min-h-screen">
      <AmbientBackground palette={palette} />

      {isLoading && items.length === 0 ? (
        <SkeletonBanner />
      ) : featured.length > 0 ? (
        <HeroBanner
          key={`${genreId}-${mediaType}`}
          pageTitle={genreName}
          items={featured}
          palette={palette}
          onActiveItemChange={handleActiveHeroChange}
        />
      ) : (
        <div className="pt-36" />
      )}

      <section className={cn(PAGE_GUTTER, 'relative z-10 -mt-8 sm:-mt-12 w-full')} aria-labelledby="genre-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Genre</p>
        <h2 id="genre-heading" className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
          {genreName}
        </h2>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
            {(
              [
                ['all', 'All'],
                ['movie', 'Movies'],
                ['tv', 'Series'],
              ] as [MediaType | 'all', string][]
            ).map(([id, label]) => (
              <Chip key={id} selected={mediaType === id} onClick={() => handleTypeChange(id)}>
                {label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sort">
            {(
              [
                ['popularity.desc', 'Popular'],
                ['vote_average.desc', 'Top rated'],
                ['primary_release_date.desc', 'Newest'],
                ['original_title.asc', 'A–Z'],
              ] as [string, string][]
            ).map(([id, label]) => (
              <Chip key={id} selected={sortBy === id} onClick={() => handleSortChange(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className={GRID} role="status" aria-label="Loading titles">
              {Array.from({ length: 18 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div key={`${mediaType}-${sortBy}`} className={cn('stagger reveal', GRID)} ref={gridRevealRef}>
                {items.map((item, i) => (
                  <div key={`${item.type}-${item.id}`} style={{ '--i': i % 12 } as React.CSSProperties}>
                    <MediaCard item={item} />
                  </div>
                ))}
              </div>
              {page < totalPages && <LoadMore onLoadMore={handleLoadMore} isLoading={isLoadingMore} />}
            </>
          ) : (
            <p className="py-20 text-center text-sm text-muted">Nothing in this genre for that filter yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function GenrePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <GenreContent />
    </Suspense>
  );
}
