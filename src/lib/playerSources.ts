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
    id: 'superembed',
    name: 'Server 2 (SuperEmbed VIP)',
    badge: '🎨 Custom Styled VIP',
    getMovieUrl: (id) => `/api/superembed?video_id=${id}&tmdb=1`,
    getTvUrl: (id, s, e) => `/api/superembed?video_id=${id}&tmdb=1&season=${s}&episode=${e}`,
  },
  {
    id: 'videasy',
    name: 'Server 3 (Videasy HD)',
    badge: 'Clean Cinema',
    getMovieUrl: (id) => `https://player.videasy.net/movie/${id}?color=e50914&autoplay=1`,
    getTvUrl: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=e50914&autoplay=1&nextEpisode=1`,
  },
  {
    id: '2embed',
    name: 'Server 4 (2Embed HD)',
    badge: 'Full-HD Cinema',
    getMovieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'smashystream',
    name: 'Server 5 (SmashyStream CDN)',
    badge: 'Backup Fast',
    getMovieUrl: (id) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    getTvUrl: (id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
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
