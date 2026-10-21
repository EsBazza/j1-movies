// VidFast only: it was the most reliable/responsive in testing. Add sources here to
// bring back the server picker (the watch page shows it when there's more than one).
export type StreamingSourceId = 'vidfast';

export interface PlayerUrlOptions {
  /** Resume position in seconds */
  startAt?: number;
  autoplay?: boolean;
}

export interface StreamingSource {
  id: StreamingSourceId;
  name: string;
  badge: string;
  /** Origin used to validate postMessage events from the embed */
  origin: string;
  /** Whether the embed posts playback progress events we can track */
  emitsProgress: boolean;
  getMovieUrl: (tmdbId: number | string, opts?: PlayerUrlOptions) => string;
  getTvUrl: (tmdbId: number | string, season: number, episode: number, opts?: PlayerUrlOptions) => string;
}

const BRAND = 'e50914';

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined) search.set(key, String(val));
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

function startAt(opts?: PlayerUrlOptions): number | undefined {
  return opts?.startAt && opts.startAt > 5 ? Math.floor(opts.startAt) : undefined;
}

export const STREAMING_SERVERS: StreamingSource[] = [
  {
    id: 'vidfast',
    name: 'VidFast',
    badge: 'Default',
    origin: 'https://vidfast.vc',
    // Undocumented; if it posts PLAYER_EVENT messages they're picked up, otherwise ignored
    emitsProgress: true,
    getMovieUrl: (id, opts) =>
      `https://vidfast.vc/movie/${id}` + query({ theme: BRAND, autoPlay: opts?.autoplay, startAt: startAt(opts) }),
    getTvUrl: (id, s, e, opts) =>
      `https://vidfast.vc/tv/${id}/${s}/${e}` +
      query({ theme: BRAND, autoPlay: opts?.autoplay, startAt: startAt(opts), nextButton: true, autoNext: true }),
  },
];

export const DEFAULT_SERVER_ID: StreamingSourceId = 'vidfast';

export function isStreamingSourceId(id: unknown): id is StreamingSourceId {
  return typeof id === 'string' && STREAMING_SERVERS.some((s) => s.id === id);
}

export function getServer(serverId: string): StreamingSource {
  return STREAMING_SERVERS.find((s) => s.id === serverId) || STREAMING_SERVERS[0];
}

export function getPlayerUrlForServer(
  serverId: string,
  type: 'movie' | 'tv',
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1,
  opts?: PlayerUrlOptions
): string {
  const server = getServer(serverId);
  return type === 'movie' ? server.getMovieUrl(tmdbId, opts) : server.getTvUrl(tmdbId, season, episode, opts);
}
