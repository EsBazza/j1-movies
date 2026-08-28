import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  const searchParams = request.nextUrl.searchParams;

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

  if (!apiKey && !readAccessToken) {
    return NextResponse.json(
      {
        error: 'TMDB API Key missing',
        message:
          'Please ensure your TMDB API key or Read Access Token is defined in .env or .env.local (e.g. TMDB_API_KEY=your_key or TMDB_READ_ACCESS_TOKEN=your_token).',
      },
      { status: 401 }
    );
  }

  // Construct target URL
  const targetUrl = new URL(`${TMDB_BASE_URL}/${endpoint}`);
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (readAccessToken) {
    headers['Authorization'] = `Bearer ${readAccessToken}`;
  } else if (apiKey) {
    targetUrl.searchParams.set('api_key', apiKey);
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers,
      next: {
        // Cache listings for 1 hour, details for 24 hours
        revalidate: endpoint.includes('details') || endpoint.includes('credits') ? 86400 : 3600,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `TMDB API error (${response.status})`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to communicate with TMDB API',
        message: error.message || 'Unknown network error',
      },
      { status: 500 }
    );
  }
}
