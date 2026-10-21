'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Play } from 'lucide-react';
import {
  getMovieDetails,
  getTVDetails,
  getBackdropUrl,
  normalizeUnique,
  pickLogo,
  getCertification,
  isNotFoundError,
} from '@/lib/tmdb';
import { TMDBMovieDetails, TMDBTVDetails, TMDBVideo } from '@/types/tmdb';
import { extractPaletteFromImage, getPaletteForGenre, DEFAULT_PALETTE, ExtractedPalette } from '@/lib/colorExtractor';
import { useUserStoreSelector } from '@/lib/store';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { CastList } from '@/components/media/CastList';
import { DetailsHero } from '@/components/details/DetailsHero';
import { EpisodesPanel } from '@/components/details/EpisodesPanel';
import { AboutSection } from '@/components/details/AboutSection';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { Modal } from '@/components/ui/Modal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MediaCarousel, PAGE_GUTTER } from '@/components/media/MediaCarousel';
import { useReveal } from '@/lib/useReveal';
import { Button, LinkButton } from '@/components/ui/Button';

function pickTrailer(videos: TMDBVideo[]): TMDBVideo | undefined {
  return videos.find((v) => v.type === 'Trailer') || videos.find((v) => v.type === 'Teaser') || videos[0];
}

function DetailsSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const revealRef = useReveal<HTMLElement>();
  return (
    <section ref={revealRef} aria-labelledby={`${id}-heading`} className={`reveal ${PAGE_GUTTER} w-full`}>
      <SectionHeader id={`${id}-heading`} title={title} className="mb-6 sm:mb-8" />
      {children}
    </section>
  );
}

export default function MediaDetailsPage() {
  const routeParams = useParams();
  const rawType = routeParams?.type as string;
  if (rawType !== 'movie' && rawType !== 'tv') notFound();
  const type: 'movie' | 'tv' = rawType;
  const id = (routeParams?.id as string) || '';

  const [state, setState] = useState<{
    key: string;
    details: TMDBMovieDetails | TMDBTVDetails | null;
    error: 'not-found' | 'failed' | null;
  } | null>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [retryKey, setRetryKey] = useState(0);
  const [modalVideo, setModalVideo] = useState<TMDBVideo | null>(null);

  const requestKey = `${type}-${id}-${retryKey}`;
  const historyItem = useUserStoreSelector((s) => s.history.find((h) => String(h.id) === id && h.type === type));

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    (type === 'movie' ? getMovieDetails(id) : getTVDetails(id))
      .then((res) => {
        if (ignore) return;
        setState({ key: requestKey, details: res, error: null });
        const genreId = res.genres?.[0]?.id;
        if (res.backdrop_path || res.poster_path) {
          extractPaletteFromImage(getBackdropUrl(res.backdrop_path || res.poster_path, 'w780'), genreId).then(
            (p) => !ignore && setPalette(p)
          );
        } else {
          setPalette(getPaletteForGenre(genreId));
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error('Failed to load media details:', err);
        setState({ key: requestKey, details: null, error: isNotFoundError(err) ? 'not-found' : 'failed' });
      });
    return () => {
      ignore = true;
    };
  }, [type, id, requestKey]);

  const current = state?.key === requestKey ? state : null;
  const details = current?.details ?? null;

  const derived = useMemo(() => {
    if (!details) return null;
    const title =
      (type === 'movie' ? (details as TMDBMovieDetails).title : (details as TMDBTVDetails).name) ||
      details.original_title ||
      'Untitled';
    const videos = (details.videos?.results || []).filter((v) => v.site === 'YouTube');
    const seasons = type === 'tv' ? ((details as TMDBTVDetails).seasons || []).filter((s) => s.season_number > 0) : [];
    const recommendations = normalizeUnique(
      [...(details.recommendations?.results || []), ...(details.similar?.results || [])],
      type
    )
      .filter((r) => r.posterPath)
      .slice(0, 18);
    return {
      title,
      videos,
      trailer: pickTrailer(videos),
      seasons,
      recommendations,
      logoPath: pickLogo(details.images?.logos)?.file_path || null,
      certification: getCertification(details, type),
    };
  }, [details, type]);

  if (!current) {
    return <SkeletonBanner />;
  }

  if (!details || !derived) {
    const notFoundError = current.error !== 'failed';
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 text-center px-4">
        <AlertCircle className="w-10 h-10 text-accent mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white mb-2">{notFoundError ? 'Title not found' : "Couldn't load this title"}</h1>
        <p className="text-muted text-sm mb-6 max-w-sm">
          {notFoundError
            ? 'This movie or series does not exist or was removed from TMDB.'
            : 'Something went wrong while loading. Check your connection and try again.'}
        </p>
        <div className="flex gap-3">
          {!notFoundError && <Button onClick={() => setRetryKey((k) => k + 1)}>Try again</Button>}
          <LinkButton href="/" variant="secondary">
            Return home
          </LinkButton>
        </div>
      </div>
    );
  }

  const tv = type === 'tv' ? (details as TMDBTVDetails) : null;

  return (
    <div className="w-full pb-28 lg:pb-16">
      <AmbientBackground palette={palette} />

      <DetailsHero
        key={`${type}-${id}`}
        details={details}
        type={type}
        title={derived.title}
        logoPath={derived.logoPath}
        trailerKey={derived.trailer?.key || null}
        certification={derived.certification}
        historyItem={historyItem}
        firstSeason={derived.seasons[0]?.season_number ?? 1}
        palette={palette}
      />

      {/* One scrolling page: spacious, revealed sections (no tabs) */}
      <div className="flex flex-col gap-20 sm:gap-28 pt-10 sm:pt-16">
        <DetailsSection id="about" title="About">
          <AboutSection details={details} type={type} />
        </DetailsSection>

        {tv && derived.seasons.length > 0 && (
          <DetailsSection id="episodes" title="Episodes">
            <EpisodesPanel tvId={tv.id} seasons={derived.seasons} fallbackStill={tv.backdrop_path} historyItem={historyItem} />
          </DetailsSection>
        )}

        {(details.credits?.cast?.length ?? 0) > 0 && (
          <DetailsSection id="cast" title="Cast & crew">
            <CastList cast={details.credits?.cast || []} crew={details.credits?.crew || []} />
          </DetailsSection>
        )}

        {derived.videos.length > 0 && (
          <DetailsSection id="videos" title="Trailers & clips">
            <ul className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {derived.videos.slice(0, 8).map((vid, i) => (
                <li key={vid.id} style={{ '--i': i } as React.CSSProperties}>
                  <button type="button" onClick={() => setModalVideo(vid)} className="group block w-full text-left">
                    <span className="relative block aspect-video rounded-card overflow-hidden bg-surface-2">
                      <Image
                        src={`https://i.ytimg.com/vi/${vid.key}/hqdefault.jpg`}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                        <span className="w-11 h-11 rounded-full bg-white/90 text-black flex items-center justify-center">
                          <Play className="w-5 h-5 fill-black ml-0.5" aria-hidden="true" />
                        </span>
                      </span>
                    </span>
                    <span className="block mt-3 text-sm font-medium text-zinc-200 group-hover:text-white line-clamp-1">{vid.name}</span>
                    <span className="block text-xs text-subtle mt-0.5">{vid.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </DetailsSection>
        )}


        {derived.recommendations.length > 0 && <MediaCarousel title="More like this" items={derived.recommendations} />}

      </div>

      <Modal isOpen={Boolean(modalVideo)} onClose={() => setModalVideo(null)} title={modalVideo?.name} className="max-w-5xl">
        {modalVideo && (
          <div className="relative aspect-video w-full rounded-card overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${modalVideo.key}?autoplay=1&rel=0`}
              title={modalVideo.name}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
