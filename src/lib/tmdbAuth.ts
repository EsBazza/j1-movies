const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Builds an authenticated TMDB request from server-only environment variables.
 * Never use NEXT_PUBLIC_* here — those are inlined into the client bundle.
 */
export function buildTMDBRequest(
  path: string,
  params: Record<string, string | number> | URLSearchParams = {}
): { url: string; headers: HeadersInit } {
  const apiKey = process.env.TMDB_API_KEY;
  const readAccessToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!apiKey && !readAccessToken) {
    throw new Error('TMDB credentials are not configured (set TMDB_API_KEY or TMDB_READ_ACCESS_TOKEN)');
  }

  const targetUrl = new URL(`${TMDB_BASE_URL}/${path}`);
  const entries = params instanceof URLSearchParams ? Array.from(params.entries()) : Object.entries(params);
  entries.forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      targetUrl.searchParams.set(key, String(val));
    }
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (readAccessToken) {
    headers['Authorization'] = `Bearer ${readAccessToken}`;
  } else if (apiKey) {
    targetUrl.searchParams.set('api_key', apiKey);
  }

  return { url: targetUrl.toString(), headers };
}
