import { NextRequest, NextResponse } from 'next/server';
import { buildTMDBRequest } from '@/lib/tmdbAuth';

// Only endpoints the app actually uses — prevents the proxy being used as an open TMDB gateway.
const ALLOWED_PREFIXES = ['movie/', 'tv/', 'person/', 'search/', 'discover/', 'trending/', 'genre/'];
const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_QUERY_KEYS = new Set([
  'page',
  'query',
  'include_adult',
  'append_to_response',
  'include_image_language',
  'language',
  'sort_by',
  'with_genres',
  'without_genres',
  'with_keywords',
  'without_keywords',
  'with_original_language',
  'with_origin_country',
  'primary_release_year',
  'first_air_date_year',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'first_air_date.gte',
  'first_air_date.lte',
  'vote_average.gte',
  'vote_count.gte',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (!path?.length || !path.every((segment) => SAFE_SEGMENT.test(segment))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const endpoint = path.join('/');
  if (!ALLOWED_PREFIXES.some((prefix) => `${endpoint}/`.startsWith(prefix))) {
    return NextResponse.json({ error: 'Endpoint not allowed' }, { status: 403 });
  }

  const query = new URLSearchParams();
  request.nextUrl.searchParams.forEach((value, key) => {
    if (ALLOWED_QUERY_KEYS.has(key)) query.set(key, value);
  });

  let tmdbRequest: { url: string; headers: HeadersInit };
  try {
    tmdbRequest = buildTMDBRequest(endpoint, query);
  } catch (error) {
    return NextResponse.json(
      { error: 'TMDB_NOT_CONFIGURED', message: (error as Error).message },
      { status: 503 }
    );
  }

  const isDetail =
    endpoint.startsWith('movie/') || endpoint.startsWith('tv/') || endpoint.startsWith('person/');
  const cacheTime = isDetail ? 86400 : 3600;

  try {
    const response = await fetch(tmdbRequest.url, {
      headers: tmdbRequest.headers,
      next: { revalidate: cacheTime },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `TMDB API error (${response.status})`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheTime}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to communicate with TMDB API', message: (error as Error).message || 'Unknown network error' },
      { status: 502 }
    );
  }
}
