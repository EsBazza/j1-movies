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
 * Build TMDB image URL with resolution sizing
 */
export function getImageUrl(
  path: string | null | undefined,
  size: 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
): string {
  if (!path) return '/placeholder-poster.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getPosterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' = 'w500'): string {
  return getImageUrl(path, size);
}

export function getBackdropUrl(path: string | null | undefined, size: 'w780' | 'w1280' | 'original' = 'original'): string {
  if (!path) return '/placeholder-backdrop.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
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
    genres: item.genres,
  };
}

/**
 * Helper to fetch from internal /api/tmdb proxy (client) or direct TMDB API (server)
 */
async function fetchFromTMDB<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.set(key, String(val));
      }
    });

    const queryStr = searchParams.toString();
    const url = `/api/tmdb/${path}${queryStr ? `?${queryStr}` : ''}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `TMDB API Request Failed: ${res.status}`);
    }

    return res.json();
  }

  // Server-side (SSR / Static Generation / Build time)
  const apiKey =
    process.env.TMDB_API_KEY ||
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    process.env.TMDB_KEY ||
    process.env.API_KEY;

  const readAccessToken =
    process.env.TMDB_READ_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_TMDB_READ_ACCESS_TOKEN ||
    process.env.TMDB_TOKEN ||
    process.env.TMDB_ACCESS_TOKEN;

  const targetUrl = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      targetUrl.searchParams.set(key, String(val));
    }
  });

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (readAccessToken) {
    headers['Authorization'] = `Bearer ${readAccessToken}`;
  } else if (apiKey) {
    targetUrl.searchParams.set('api_key', apiKey);
  }

  const res = await fetch(targetUrl.toString(), {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.status_message || `TMDB API Request Failed: ${res.status}`);
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
    append_to_response: 'credits,videos,recommendations,similar',
  });
}

export async function getTVDetails(id: number | string): Promise<TMDBTVDetails> {
  return fetchFromTMDB<TMDBTVDetails>(`tv/${id}`, {
    append_to_response: 'credits,videos,recommendations,similar',
  });
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
  sortBy?: string;
  minRating?: number;
  year?: string;
  language?: string;
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

  if (filters.language) {
    params.with_original_language = filters.language;
  }

  return fetchFromTMDB<TMDBPaginatedResponse<TMDBMediaItem>>(`discover/${filters.mediaType}`, params);
}
