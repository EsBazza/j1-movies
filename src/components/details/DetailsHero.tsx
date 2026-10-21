'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, RotateCcw, Share2, Star } from 'lucide-react';
import { TMDBMovieDetails, TMDBTVDetails, WatchHistoryItem } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl, getLogoUrl } from '@/lib/tmdb';
import { TRAILER_FADE, useAutoplayAllowed, useBackgroundTrailer } from '@/lib/youtube';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { LinkButton, IconButton } from '@/components/ui/Button';
import { ExtractedPalette } from '@/lib/colorExtractor';
import { useTrailerPalette } from '@/lib/palette';
import { VolumeControl } from '@/components/ui/VolumeControl';
import { toast } from '@/components/ui/Toast';
import { formatRuntime, formatYear, cn } from '@/lib/utils';

interface DetailsHeroProps {
  details: TMDBMovieDetails | TMDBTVDetails;
  type: 'movie' | 'tv';
  title: string;
  logoPath: string | null;
  trailerKey: string | null;
  certification: string | null;
  historyItem?: WatchHistoryItem;
  /** First season number (TV) for "Play from the start" */
  firstSeason: number;
  /** Title palette; restored when the trailer isn't playing */
  palette: ExtractedPalette;
}

export function DetailsHero({
  details,
  type,
  title,
  logoPath,
  trailerKey,
  certification,
  historyItem,
  firstSeason,
  palette,
}: DetailsHeroProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [highlightResume, setHighlightResume] = useState(false);
  const resumeRef = useRef<HTMLAnchorElement>(null);
  const autoplayAllowed = useAutoplayAllowed();

  const {
    observeContainer,
    attachIframe,
    iframeProps,
    isPlaying,
    revealClass,
  } = useBackgroundTrailer({ videoKey: trailerKey, enabled: autoplayAllowed, loop: true });

  // Ambient colours follow the trailer while it plays
  useTrailerPalette(trailerKey, isPlaying, palette);

  // Arriving from Continue Watching (#resume): focus and briefly highlight Resume
  useEffect(() => {
    if (window.location.hash !== '#resume') return;
    resumeRef.current?.focus({ preventScroll: true });
    setHighlightResume(true);
    const t = setTimeout(() => setHighlightResume(false), 2400);
    return () => clearTimeout(t);
  }, []);

  const releaseDate = type === 'movie' ? (details as TMDBMovieDetails).release_date : (details as TMDBTVDetails).first_air_date;
  const runtime = type === 'movie' ? (details as TMDBMovieDetails).runtime : undefined;
  const tv = type === 'tv' ? (details as TMDBTVDetails) : null;

  const hasProgress = Boolean(historyItem?.progressSeconds && !historyItem.finished);
  const lastEpisode = type === 'tv' && historyItem?.season && historyItem.episode ? historyItem : null;
  const resumeHref = lastEpisode
    ? `/watch/tv/${details.id}?season=${lastEpisode.season}&episode=${lastEpisode.episode}`
    : `/watch/${type}/${details.id}`;
  const startHref = type === 'movie' ? `/watch/movie/${details.id}` : `/watch/tv/${details.id}?season=${firstSeason}&episode=1`;
  const remainingMins =
    hasProgress && historyItem?.durationSeconds && historyItem.progressSeconds
      ? Math.max(1, Math.round((historyItem.durationSeconds - historyItem.progressSeconds) / 60))
      : 0;

  let primaryLabel = 'Play';
  if (lastEpisode) primaryLabel = `${hasProgress ? 'Resume' : 'Continue'} S${lastEpisode.season} E${lastEpisode.episode}`;
  else if (hasProgress) primaryLabel = 'Resume';

  const share = async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      // user cancelled the share sheet
    }
  };

  const showTrailer = Boolean(iframeProps) && isPlaying;

  return (
    <section ref={observeContainer} className="relative w-full min-h-[86svh] sm:min-h-[88vh] max-h-[1000px] flex flex-col justify-end overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden fade-bottom">
        <Image
          src={
            backdropFailed
              ? getPosterUrl(details.poster_path, 'w780')
              : getBackdropUrl(details.backdrop_path || details.poster_path, 'w1280')
          }
          alt=""
          fill
          priority
          sizes="100vw"
          onError={() => setBackdropFailed(true)}
          className="object-cover object-[center_20%]"
        />
        {iframeProps && (
          <iframe
            ref={attachIframe}
            {...iframeProps}
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none',
              TRAILER_FADE.base,
              'w-[max(100%,177.78vh)] h-[max(100%,56.25vw)] scale-[1.18]',
              showTrailer ? revealClass : TRAILER_FADE.out
            )}
          />
        )}
        {/* Media fades to transparent (mask), so the ambient background continues below
            without a visible edge; a soft blur band smooths the transition */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 blur-band" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
      </div>

      <div className="relative max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-28 pb-10 sm:pb-14">
        <div className="max-w-2xl animate-slide-up">
          {logoPath && !logoFailed ? (
            <>
              <h1 className="sr-only">{title}</h1>
              <div className="relative w-[min(80vw,520px)] h-24 sm:h-36 lg:h-44 mb-5">
                <Image
                  src={getLogoUrl(logoPath, 'w500')}
                  alt=""
                  fill
                  priority
                  sizes="520px"
                  onError={() => setLogoFailed(true)}
                  className="object-contain object-left-bottom drop-shadow-[0_6px_24px_rgba(0,0,0,0.7)]"
                />
              </div>
            </>
          ) : (
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.02] mb-5">{title}</h1>
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-200">
            {details.vote_average > 0 && (
              <span className="flex items-center gap-1 font-semibold text-white">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="sr-only">TMDB rating </span>
                {Math.round(details.vote_average * 10) / 10}
              </span>
            )}
            {releaseDate && <span>{formatYear(releaseDate)}</span>}
            {certification && (
              <span className="px-1.5 py-px rounded bg-white/15 text-xs font-semibold">
                <span className="sr-only">Rated </span>
                {certification}
              </span>
            )}
            {runtime ? <span>{formatRuntime(runtime)}</span> : null}
            {tv && (
              <span>
                {tv.number_of_seasons} {tv.number_of_seasons === 1 ? 'season' : 'seasons'}
              </span>
            )}
          </p>

          {details.genres?.length > 0 && (
            <p className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm">
              {details.genres.slice(0, 4).map((g) => (
                <Link key={g.id} href={`/genre/${g.id}?type=${type}`} className="text-muted hover:text-white transition-colors">
                  {g.name}
                </Link>
              ))}
            </p>
          )}


          {hasProgress && historyItem?.progressPercent ? (
            <div className="mt-5 flex items-center gap-3 max-w-xs" aria-hidden="true">
              <span className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <span className="block h-full bg-accent" style={{ width: `${historyItem.progressPercent}%` }} />
              </span>
              {remainingMins ? <span className="text-xs text-muted">{formatRuntime(remainingMins)} left</span> : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LinkButton
              ref={resumeRef}
              id="resume"
              href={resumeHref}
              size="lg"
              className={cn(highlightResume && 'ring-4 ring-white/40 ring-offset-2 ring-offset-bg')}
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              {primaryLabel}
            </LinkButton>
            {(hasProgress || lastEpisode) && (
              <LinkButton href={startHref} variant="secondary" size="lg">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {type === 'tv' ? 'From E1' : 'Start over'}
              </LinkButton>
            )}
            <BookmarkButton
              item={{
                id: details.id,
                type,
                title,
                poster_path: details.poster_path,
                backdrop_path: details.backdrop_path,
                vote_average: details.vote_average,
                release_date: releaseDate,
              }}
              className="w-12 h-12 p-0 inline-flex items-center justify-center"
            />
            <IconButton aria-label="Share" size="lg" onClick={share}>
              <Share2 className="w-5 h-5" aria-hidden="true" />
            </IconButton>
            {iframeProps && <VolumeControl />}
          </div>
        </div>
      </div>
    </section>
  );
}
