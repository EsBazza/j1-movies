import {
  TMDBGenre,
  TMDBMediaItem,
  TMDBMovieDetails,
  TMDBPaginatedResponse,
  TMDBSeason,
  TMDBTVDetails,
  MediaType,
  NormalizedMedia,
} from '@/types/tmdb';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Build TMDB image URL with resolution sizing and safe fallback
 */
export function getImageUrl(
  path: string | null | undefined,
  size: 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
): string {
  if (!path) return '/placeholder-poster.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

export function getPosterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' = 'w500'): string {
  if (!path) return '/placeholder-poster.svg';
  return getImageUrl(path, size);
}

export function getBackdropUrl(path: string | null | undefined, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return '/placeholder-backdrop.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

export function getLogoUrl(path: string | null | undefined, size: 'w300' | 'w500' | 'original' = 'w500'): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Standardizes raw TMDB items across Movies, TV, and Multi-search responses
 */
export function normalizeMediaItem(item: TMDBMediaItem, fallbackType: MediaType = 'movie'): NormalizedMedia {
  const type: MediaType = item.media_type || fallbackType;
  const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
  const releaseDate = item.release_date || item.first_air_date || '';

  return {
    id: item.id,
    type,
    title,
    overview: item.overview || '',
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    rating: typeof item.vote_average === 'number' ? Math.round(item.vote_average * 10) / 10 : 0,
    releaseDate,
    popularity: item.popularity,
    genres: item.genres,
  };
}

/** Normalizes a list and drops duplicates (e.g. titles present in both recommendations and similar). */
export function normalizeUnique(items: TMDBMediaItem[], fallbackType: MediaType = 'movie'): NormalizedMedia[] {
  const seen = new Set<string>();
  const out: NormalizedMedia[] = [];
  for (const item of items) {
    const normalized = normalizeMediaItem(item, fallbackType);
    const key = `${normalized.type}-${normalized.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

/** Picks the best title logo: English PNG first, then any English, then any PNG. */
export function pickLogo(logos: { iso_639_1: string | null; file_path: string }[] | undefined) {
  if (!logos?.length) return undefined;
  return (
    logos.find((l) => l.iso_639_1 === 'en' && l.file_path?.endsWith('.png')) ||
    logos.find((l) => l.iso_639_1 === 'en') ||
    logos.find((l) => l.file_path?.endsWith('.png')) ||
    logos[0]
  );
}

/** US content rating (e.g. PG-13, TV-MA) when TMDB has one. */
export function getCertification(details: TMDBMovieDetails | TMDBTVDetails, type: MediaType): string | null {
  if (type === 'movie') {
    const us = (details as TMDBMovieDetails).release_dates?.results?.find((r) => r.iso_3166_1 === 'US');
    return us?.release_dates?.find((d) => d.certification)?.certification || null;
  }
  const us = (details as TMDBTVDetails).content_ratings?.results?.find((r) => r.iso_3166_1 === 'US');
  return us?.rating || null;
}

/**
 * Error carrying the HTTP status so callers can tell "not found" apart from outages.
 */
export class TMDBError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'TMDBError';
  }
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof TMDBError && error.status === 404;
}

/**
 * Fetches TMDB data. In the browser this always goes through the /api/tmdb proxy so
 * credentials never reach the client; on the server it calls TMDB directly.
 */
async function fetchFromTMDB<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  let res: Response;

  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.set(key, String(val));
      }
    });
    const queryStr = searchParams.toString();
    res = await fetch(`/api/tmdb/${path}${queryStr ? `?${queryStr}` : ''}`);
  } else {
    const { buildTMDBRequest } = await import('./tmdbAuth');
    const { url, headers } = buildTMDBRequest(path, params);
    res = await fetch(url, { headers, next: { revalidate: 3600 } });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new TMDBError(
      errorData.error || errorData.status_message || `TMDB API Request Failed: ${res.status}`,
      res.status
    );
  }

  return res.json();
}

// ----------------- TMDB API ENDPOINTS -----------------

export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'day'
): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>(`trending/${mediaType}/${timeWindow}`);
}

export async function getPopularMovies(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('movie/popular', { page });
}

export async function getTopRatedMovies(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('movie/top_rated', { page });
}

export async function getPopularTV(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('tv/popular', { page });
}

export async function getTopRatedTV(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('tv/top_rated', { page });
}

export async function getMoviesByGenre(
  genreId: number | string,
  page: number = 1,
  sortBy: string = 'popularity.desc'
): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  const params: Record<string, string | number> = {
    with_genres: genreId,
    sort_by: sortBy,
    page,
  };
  if (sortBy === 'vote_average.desc') {
    params['vote_count.gte'] = 100;
  }
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/movie', params);
}

export async function getTVByGenre(
  genreId: number | string,
  page: number = 1,
  sortBy: string = 'popularity.desc'
): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  const params: Record<string, string | number> = {
    with_genres: genreId,
    sort_by: sortBy,
    page,
  };
  if (sortBy === 'vote_average.desc') {
    params['vote_count.gte'] = 50;
  }
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', params);
}

export async function getMovieDetails(id: number | string): Promise<TMDBMovieDetails> {
  return fetchFromTMDB<TMDBMovieDetails>(`movie/${id}`, {
    append_to_response: 'credits,videos,recommendations,similar,images,release_dates',
    include_image_language: 'en,null,ja,ko,fr,es,de,it',
  });
}

export async function getTVDetails(id: number | string): Promise<TMDBTVDetails> {
  return fetchFromTMDB<TMDBTVDetails>(`tv/${id}`, {
    append_to_response: 'credits,videos,recommendations,similar,images,content_ratings',
    include_image_language: 'en,null,ja,ko,fr,es,de,it',
  });
}

export async function getMediaVideos(type: MediaType, id: number | string): Promise<import('@/types/tmdb').TMDBVideoResponse> {
  return fetchFromTMDB<import('@/types/tmdb').TMDBVideoResponse>(`${type}/${id}/videos`);
}

const trailerCache = new Map<string, string | null>();

export async function getTrailerKey(type: MediaType, id: number | string): Promise<string | null> {
  const cacheKey = `${type}-${id}`;
  if (trailerCache.has(cacheKey)) {
    return trailerCache.get(cacheKey) || null;
  }
  try {
    const res = await getMediaVideos(type, id);
    const videos = (res?.results || []).filter((v) => v.site === 'YouTube');
    const trailer =
      videos.find((v) => v.type === 'Trailer') ||
      videos.find((v) => v.type === 'Teaser') ||
      videos.find((v) => v.type === 'Clip') ||
      videos[0];
    const key = trailer?.key || null;
    trailerCache.set(cacheKey, key);
    return key;
  } catch {
    trailerCache.set(cacheKey, null);
    return null;
  }
}

export async function getTVSeason(tvId: number | string, seasonNumber: number): Promise<TMDBSeason> {
  return fetchFromTMDB<TMDBSeason>(`tv/${tvId}/season/${seasonNumber}`);
}

export async function searchMulti(query: string, page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('search/multi', {
    query,
    page,
    include_adult: 'false',
  });
}

export async function getMovieGenres(): Promise<{ genres: TMDBGenre[] }> {
  return fetchFromTMDB<{ genres: TMDBGenre[] }>('genre/movie/list');
}

export async function getTVGenres(): Promise<{ genres: TMDBGenre[] }> {
  return fetchFromTMDB<{ genres: TMDBGenre[] }>('genre/tv/list');
}

export async function getPersonDetails(id: number | string): Promise<import('@/types/tmdb').TMDBPersonDetails> {
  return fetchFromTMDB<import('@/types/tmdb').TMDBPersonDetails>(`person/${id}`, {
    append_to_response: 'combined_credits,images',
  });
}

export interface DiscoverFilters {
  mediaType: 'movie' | 'tv';
  genreId?: number | string;
  withoutGenres?: string;
  sortBy?: string;
  minRating?: number;
  year?: string;
  language?: string;
  withOriginalLanguage?: string;
  withOriginCountry?: string;
  withKeywords?: string;
  withoutKeywords?: string;
  page?: number;
}

export async function discoverMedia(filters: DiscoverFilters): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  const params: Record<string, string | number> = {
    sort_by: filters.sortBy || 'popularity.desc',
    page: filters.page || 1,
  };

  if (filters.genreId) {
    params.with_genres = filters.genreId;
  }

  if (filters.withoutGenres) {
    params.without_genres = filters.withoutGenres;
  }

  if (filters.minRating && filters.minRating > 0) {
    params['vote_average.gte'] = filters.minRating;
    params['vote_count.gte'] = 20;
  }

  if (filters.year) {
    if (filters.mediaType === 'movie') {
      params['primary_release_year'] = filters.year;
    } else {
      params['first_air_date_year'] = filters.year;
    }
  }

  if (filters.withOriginCountry) {
    params.with_origin_country = filters.withOriginCountry;
  }

  if (filters.withOriginalLanguage) {
    params.with_original_language = filters.withOriginalLanguage;
  } else if (filters.language) {
    params.with_original_language = filters.language;
  }

  if (filters.withKeywords) {
    params.with_keywords = filters.withKeywords;
  }

  if (filters.withoutKeywords) {
    params.without_keywords = filters.withoutKeywords;
  }

  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>(`discover/${filters.mediaType}`, params);
}

// ── Anime Discovery Endpoints ──────────────────────────────
export async function getTrendingAnime(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
}

export async function getPopularAnime(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'vote_count.desc',
    'vote_count.gte': 50,
    page,
  });
}

export async function getTopRatedAnime(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 200,
    page,
  });
}

export async function getAnimeMovies(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/movie', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
}

// ── K-Drama Discovery Endpoints ────────────────────────────
export async function getTrendingKDrama(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', {
    with_original_language: 'ko',
    sort_by: 'popularity.desc',
    page,
  });
}

export async function getTopRatedKDrama(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', {
    with_original_language: 'ko',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 100,
    page,
  });
}

export async function getPopularKDrama(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/tv', {
    with_original_language: 'ko',
    sort_by: 'vote_count.desc',
    'vote_count.gte': 40,
    page,
  });
}

export async function getKDramaMovies(page: number = 1): Promise<TMDBPaginatedResponse<TMDBMediaItem>> {
  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>('discover/movie', {
    with_original_language: 'ko',
    sort_by: 'popularity.desc',
    page,
  });
}
