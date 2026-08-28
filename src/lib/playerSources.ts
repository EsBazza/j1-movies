export interface StreamingSource {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: number | string) => string;
  getTvUrl: (tmdbId: number | string, season: number, episode: number) => string;
}

export const STREAMING_SERVERS: StreamingSource[] = [
  {
    id: 'videasy',
    name: 'Server 1 (Videasy HD)',
    badge: 'Ultra HD',
    getMovieUrl: (id) => `https://player.videasy.net/movie/${id}?color=e50914&autoplay=1`,
    getTvUrl: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=e50914&autoplay=1&nextEpisode=1`,
  },
  {
    id: 'vidlink',
    name: 'Server 2 (VidLink Pro)',
    badge: 'Multi-Audio',
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=true`,
    getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=true`,
  },
  {
    id: 'vidsrc',
    name: 'Server 3 (Vidsrc VIP)',
    badge: 'Direct Stream',
    getMovieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'autoembed',
    name: 'Server 4 (AutoEmbed Global)',
    badge: 'Fast CDN',
    getMovieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];

export function getPlayerUrlForServer(
  serverId: string,
  type: 'movie' | 'tv',
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1
): string {
  const server = STREAMING_SERVERS.find((s) => s.id === serverId) || STREAMING_SERVERS[0];
  if (type === 'movie') {
    return server.getMovieUrl(tmdbId);
  }
  return server.getTvUrl(tmdbId, season, episode);
}
