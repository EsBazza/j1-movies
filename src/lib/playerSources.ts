export interface StreamingSource {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: number | string) => string;
  getTvUrl: (tmdbId: number | string, season: number, episode: number) => string;
}

export const STREAMING_SERVERS: StreamingSource[] = [
  {
    id: 'vidlink',
    name: 'Server 1 (VidLink Fast HD)',
    badge: '⚡ Ultra Fast (350ms)',
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=true&subtitles=true`,
    getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=true&nextEpisode=true&subtitles=true`,
  },
  {
    id: 'vidsrc',
    name: 'Server 2 (VidSrc PRO HD)',
    badge: '🚀 High Speed VIP',
    getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'autoembed',
    name: 'Server 3 (AutoEmbed Ultra)',
    badge: '💎 Multi-Stream HD',
    getMovieUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    getTvUrl: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    id: '2embed',
    name: 'Server 4 (2Embed Cinema)',
    badge: '🎬 Full-HD Cinema',
    getMovieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'superembed',
    name: 'Server 5 (SuperEmbed VIP)',
    badge: '🎨 Custom Subtitles VIP',
    getMovieUrl: (id) => `/api/superembed?video_id=${id}&tmdb=1`,
    getTvUrl: (id, s, e) => `/api/superembed?video_id=${id}&tmdb=1&season=${s}&episode=${e}`,
  },
  {
    id: 'videasy',
    name: 'Server 6 (Videasy Backup)',
    badge: '🔄 Mirror Server',
    getMovieUrl: (id) => `https://player.videasy.net/movie/${id}?color=e50914&autoplay=1`,
    getTvUrl: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=e50914&autoplay=1&nextEpisode=1`,
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
