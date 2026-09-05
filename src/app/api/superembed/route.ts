import { NextRequest, NextResponse } from 'next/server';

/**
 * SuperEmbed Advanced VIP Player Route
 * Translates se_player.php into a high-speed cached Next.js Route Handler
 * Injects custom brand styling, anti-ad parameters, and external subtitles
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('video_id') || searchParams.get('id');
  const isTmdb = searchParams.get('tmdb') || '1';
  const season = searchParams.get('season') || searchParams.get('s') || '0';
  const episode = searchParams.get('episode') || searchParams.get('e') || '0';
  const customSubUrl = searchParams.get('sub_url');
  const customSubLabel = searchParams.get('sub_label') || 'English';

  if (!videoId) {
    return NextResponse.json({ error: 'Missing video_id parameter' }, { status: 400 });
  }

  // J1 Movies Cinema Customizations
  const playerFont = 'Inter';
  const playerBgColor = '07090e'; // Cinema Dark
  const playerFontColor = 'ffffff';
  const playerPrimaryColor = 'e50914'; // Crimson Brand Accent
  const playerSecondaryColor = 'b91c1c';
  const playerLoader = '1';
  const preferredServer = '0';
  const playerSourcesToggleType = '2'; // 2 = Dropdown

  let subtitleParam = '';
  if (customSubUrl) {
    subtitleParam = `&sub_url=${encodeURIComponent(customSubUrl)}&sub_label=${encodeURIComponent(customSubLabel)}`;
  } else {
    // Attempt automatic English subtitle injection using public subtitle mirror
    try {
      const isTv = season !== '0' && episode !== '0';
      const subMirrorUrl = isTv
        ? `https://sub.wyzie.ru/tv/${videoId}/${season}/${episode}`
        : `https://sub.wyzie.ru/movie/${videoId}`;
      
      const subCheck = await fetch(subMirrorUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 86400 },
      }).catch(() => null);

      if (subCheck && subCheck.ok) {
        const subData = await subCheck.json().catch(() => null);
        const enTrack = subData?.find((t: any) => t.lang?.toLowerCase().startsWith('en') || t.language?.toLowerCase().startsWith('en')) || subData?.[0];
        if (enTrack?.url) {
          subtitleParam = `&sub_url=${encodeURIComponent(enTrack.url)}&sub_label=English`;
        }
      }
    } catch (e) {
      // Non-blocking subtitle attempt
    }
  }

  const requestUrl = `https://getsuperembed.link/?video_id=${encodeURIComponent(
    videoId
  )}&tmdb=${isTmdb}&season=${season}&episode=${episode}&player_font=${playerFont}&player_bg_color=${playerBgColor}&player_font_color=${playerFontColor}&player_primary_color=${playerPrimaryColor}&player_secondary_color=${playerSecondaryColor}&player_loader=${playerLoader}&preferred_server=${preferredServer}&player_sources_toggle_type=${playerSourcesToggleType}${subtitleParam}`;

  try {
    const res = await fetch(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 3600 },
    });

    const playerUrl = (await res.text()).trim();

    if (playerUrl && playerUrl.startsWith('https://')) {
      // Redirect straight to customized player instance
      return NextResponse.redirect(playerUrl, 307);
    } else {
      // Fallback to standard multiembed URL if resolver is unavailable
      const fallbackUrl = `https://multiembed.mov/?video_id=${videoId}&tmdb=${isTmdb}${
        season !== '0' ? `&s=${season}&e=${episode}` : ''
      }`;
      return NextResponse.redirect(fallbackUrl, 307);
    }
  } catch (err: any) {
    console.error('SuperEmbed resolution failed, falling back:', err);
    const fallbackUrl = `https://multiembed.mov/?video_id=${videoId}&tmdb=${isTmdb}${
      season !== '0' ? `&s=${season}&e=${episode}` : ''
    }`;
    return NextResponse.redirect(fallbackUrl, 307);
  }
}
