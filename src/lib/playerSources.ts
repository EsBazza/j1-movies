export type StreamingSourceId = 'vidlink' | 'vixsrc' | 'moviesapi' | 'vidfast';

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
  /** Whether the embed still plays inside a sandboxed iframe (Ad-Shield) */
  supportsSandbox: boolean;
  getMovieUrl: (tmdbId: number | string, opts?: PlayerUrlOptions) => string;
  getTvUrl: (tmdbId: number | string, season: number, episode: number, opts?: PlayerUrlOptions) => string;
}

const BRAND = 'e50914';
const BRAND_DARK = 'b91c1c';

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
    id: 'vidlink',
    name: 'VidLink',
    badge: 'Ad-free · Resume',
    origin: 'https://vidlink.pro',
    emitsProgress: true,
    supportsSandbox: true,
    getMovieUrl: (id, opts) =>
      `https://vidlink.pro/movie/${id}` +
      query({
        primaryColor: BRAND,
        secondaryColor: BRAND_DARK,
        iconColor: 'ffffff',
        icons: 'vid',
        title: false,
        poster: true,
        autoplay: opts?.autoplay,
        startAt: startAt(opts),
      }),
    getTvUrl: (id, s, e, opts) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}` +
      query({
        primaryColor: BRAND,
        secondaryColor: BRAND_DARK,
        iconColor: 'ffffff',
        icons: 'vid',
        title: false,
        poster: true,
        nextbutton: true,
        autoplay: opts?.autoplay,
        startAt: startAt(opts),
      }),
  },
  {
    id: 'vixsrc',
    name: 'VixSrc',
    badge: 'Fast · Resume',
    origin: 'https://vixsrc.to',
    emitsProgress: true,
    supportsSandbox: false,
    getMovieUrl: (id, opts) =>
      `https://vixsrc.to/movie/${id}` +
      query({ primaryColor: BRAND, secondaryColor: BRAND_DARK, autoplay: opts?.autoplay, startAt: startAt(opts) }),
    getTvUrl: (id, s, e, opts) =>
      `https://vixsrc.to/tv/${id}/${s}/${e}` +
      query({ primaryColor: BRAND, secondaryColor: BRAND_DARK, autoplay: opts?.autoplay, startAt: startAt(opts) }),
  },
  {
    id: 'moviesapi',
    name: 'MoviesAPI',
    badge: 'Backup',
    origin: 'https://moviesapi.to',
    emitsProgress: true,
    supportsSandbox: false,
    getMovieUrl: (id, opts) => `https://moviesapi.to/movie/${id}` + query({ theme: BRAND, startAt: startAt(opts) }),
    getTvUrl: (id, s, e, opts) =>
      `https://moviesapi.to/tv/${id}/${s}/${e}` + query({ theme: BRAND, startAt: startAt(opts) }),
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    badge: 'Backup',
    origin: 'https://vidfast.vc',
    emitsProgress: false,
    supportsSandbox: false,
    getMovieUrl: (id, opts) =>
      `https://vidfast.vc/movie/${id}` + query({ theme: BRAND, autoPlay: opts?.autoplay, startAt: startAt(opts) }),
    getTvUrl: (id, s, e, opts) =>
      `https://vidfast.vc/tv/${id}/${s}/${e}` +
      query({ theme: BRAND, autoPlay: opts?.autoplay, startAt: startAt(opts), nextButton: true, autoNext: true }),
  },
];

export const DEFAULT_SERVER_ID: StreamingSourceId = 'vidlink';

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
