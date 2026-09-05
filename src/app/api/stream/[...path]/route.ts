import { NextRequest, NextResponse } from 'next/server';

export interface SubtitleTrack {
  url: string;
  label: string;
  language: string;
  isDefault?: boolean;
}

export interface StreamResolutionResponse {
  success: boolean;
  streamUrl?: string;
  backupStreamUrls?: string[];
  subtitles: SubtitleTrack[];
  title?: string;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const [type, id] = path; // type: 'movie' | 'tv', id: tmdbId
  const searchParams = request.nextUrl.searchParams;
  const season = searchParams.get('season') || '1';
  const episode = searchParams.get('episode') || '1';

  if (!type || !id) {
    return NextResponse.json(
      { success: false, error: 'Missing type or media ID' },
      { status: 400 }
    );
  }

  const subtitles: SubtitleTrack[] = [];
  let streamUrl: string | undefined = undefined;
  const backupStreamUrls: string[] = [];

  try {
    // 1. Attempt VidLink Stream Provider
    const vidlinkApiUrl =
      type === 'movie'
        ? `https://vidlink.pro/api/b/movie/${id}`
        : `https://vidlink.pro/api/b/tv/${id}/${season}/${episode}`;

    try {
      const vidlinkRes = await fetch(vidlinkApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://vidlink.pro/',
        },
        next: { revalidate: 1800 },
      });

      if (vidlinkRes.ok) {
        const data = await vidlinkRes.json().catch(() => null);
        if (data?.stream?.playlist) {
          streamUrl = data.stream.playlist;
        }

        if (Array.isArray(data?.tracks)) {
          data.tracks.forEach((track: any) => {
            if (track.file && (track.kind === 'captions' || track.kind === 'subtitles')) {
              subtitles.push({
                url: track.file,
                label: track.label || track.language || 'Subtitle',
                language: track.language || track.label || 'en',
                isDefault: track.default || false,
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('VidLink stream resolution attempt warning:', err);
    }

    // 2. Add standard multilingual fallback subtitle tracks if none found
    if (subtitles.length === 0) {
      // Common default tracks or external subtitle provider integration
      subtitles.push(
        {
          url: '',
          label: 'English (Auto)',
          language: 'en',
          isDefault: true,
        }
      );
    }

    // 3. Fallback direct stream links
    if (!streamUrl) {
      // If direct stream is unavailable, signal success=false so UnifiedPlayer triggers embed fallback
      return NextResponse.json({
        success: false,
        error: 'Direct HLS stream unavailable for this title. Using fallback embed servers.',
        subtitles,
      });
    }

    return NextResponse.json(
      {
        success: true,
        streamUrl,
        backupStreamUrls,
        subtitles,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to resolve stream',
        subtitles: [],
      },
      { status: 500 }
    );
  }
}
