export interface StreamingSource {
  id: '111movies' | 'filmu';
  name: string;
  badge: string;
  speed: string;
  getMovieUrl: (tmdbId: number | string) => string;
  getTvUrl: (tmdbId: number | string, season: number, episode: number) => string;
  getAnimeUrl: (tmdbId: number | string, episode: number) => string;
}

export const STREAMING_SERVERS: StreamingSource[] = [
  {
    id: '111movies',
    name: '111movies',
    badge: 'Clean HD',
    speed: '200ms',
    getMovieUrl: (id) => `https://111movies.com/movie/${id}`,
    getTvUrl: (id, s, e) => `https://111movies.com/tv/${id}/${s}/${e}`,
    getAnimeUrl: (id, e) => `https://111movies.com/tv/${id}/1/${e}`,
  },
  {
    id: 'filmu',
    name: 'Filmu',
    badge: 'Ultra-Fast VIP',
    speed: '68ms',
    getMovieUrl: (id) => `https://embed.filmu.in/movie/${id}`,
    getTvUrl: (id, s, e) => `https://embed.filmu.in/tv/${id}/${s}/${e}`,
    getAnimeUrl: (id, e) => `https://embed.filmu.in/anime/${id}/${e}`,
  },
];

export function getPlayerUrlForServer(
  serverId: string,
  type: 'movie' | 'tv' | 'anime',
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1
): string {
  const server = STREAMING_SERVERS.find((s) => s.id === serverId) || STREAMING_SERVERS[0];
  if (type === 'anime') {
    return server.getAnimeUrl(tmdbId, episode);
  }
  if (type === 'movie') {
    return server.getMovieUrl(tmdbId);
  }
  return server.getTvUrl(tmdbId, season, episode);
}
