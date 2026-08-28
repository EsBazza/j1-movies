export interface VideasyOptions {
  color?: string; // Hex color without #, e.g., 'e50914'
  autoplay?: boolean;
  nextEpisode?: boolean;
  episodeList?: boolean;
}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEASY_BASE_URL ||
  process.env.VIDEASY_BASE_URL ||
  process.env.VIDEASY_URL ||
  'https://player.videasy.net';
const DEFAULT_BRAND_COLOR = 'e50914'; // Crimson / Netflix Red accent

/**
 * Builds standard query string parameters for Videasy player
 */
function buildQueryParams(options: VideasyOptions = {}): string {
  const params = new URLSearchParams();
  
  const color = options.color || DEFAULT_BRAND_COLOR;
  params.set('color', color.replace('#', ''));

  if (options.autoplay !== undefined) {
    params.set('autoplay', options.autoplay ? '1' : '0');
  }

  if (options.nextEpisode !== undefined) {
    params.set('nextEpisode', options.nextEpisode ? '1' : '0');
  }

  if (options.episodeList !== undefined) {
    params.set('episodeList', options.episodeList ? '1' : '0');
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Generate Videasy Movie Player URL
 */
export function getVideasyMovieUrl(
  tmdbId: number | string,
  options?: VideasyOptions
): string {
  const query = buildQueryParams(options);
  return `${DEFAULT_BASE_URL}/movie/${tmdbId}${query}`;
}

/**
 * Generate Videasy TV Show Player URL
 */
export function getVideasyTvUrl(
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1,
  options?: VideasyOptions
): string {
  const query = buildQueryParams(options);
  return `${DEFAULT_BASE_URL}/tv/${tmdbId}/${season}/${episode}${query}`;
}

/**
 * Unified helper to get player URL for any media type
 */
export function getVideasyPlayerUrl(
  type: 'movie' | 'tv',
  tmdbId: number | string,
  season?: number,
  episode?: number,
  options?: VideasyOptions
): string {
  if (type === 'movie') {
    return getVideasyMovieUrl(tmdbId, options);
  }
  return getVideasyTvUrl(tmdbId, season || 1, episode || 1, options);
}
