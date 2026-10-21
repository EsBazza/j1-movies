'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
import { formatCurrency, formatDateFull, formatRuntime } from '@/lib/utils';
import { useUserStoreSelector } from '@/lib/store';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { MediaCard } from '@/components/media/MediaCard';
import { CastList } from '@/components/media/CastList';
import { DetailsHero } from '@/components/details/DetailsHero';
import { EpisodesPanel } from '@/components/details/EpisodesPanel';
import { SkeletonBanner } from '@/components/ui/SkeletonBanner';
import { Modal } from '@/components/ui/Modal';
import { Tabs, tabPanelProps, TabItem } from '@/components/ui/Tabs';
import { Button, LinkButton } from '@/components/ui/Button';

type TabId = 'episodes' | 'more' | 'videos' | 'cast' | 'details';

function pickTrailer(videos: TMDBVideo[]): TMDBVideo | undefined {
  return videos.find((v) => v.type === 'Trailer') || videos.find((v) => v.type === 'Teaser') || videos[0];
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
  const [tab, setTab] = useState<TabId | null>(null);
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

  const tabs: TabItem<TabId>[] = [
    ...(type === 'tv' && derived.seasons.length > 0 ? [{ id: 'episodes' as const, label: 'Episodes' }] : []),
    ...(derived.recommendations.length > 0 ? [{ id: 'more' as const, label: 'More like this' }] : []),
    ...(derived.videos.length > 0 ? [{ id: 'videos' as const, label: 'Trailers & clips', count: derived.videos.length }] : []),
    ...((details.credits?.cast?.length ?? 0) > 0 ? [{ id: 'cast' as const, label: 'Cast & crew' }] : []),
    { id: 'details' as const, label: 'Details' },
  ];
  const activeTab = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  const movie = type === 'movie' ? (details as TMDBMovieDetails) : null;
  const tv = type === 'tv' ? (details as TMDBTVDetails) : null;
  const info: [string, React.ReactNode][] = [
    ['Released', formatDateFull(movie?.release_date || tv?.first_air_date)],
    ['Status', details.status],
    ['Original language', details.original_language?.toUpperCase()],
    ...(movie?.runtime ? ([['Runtime', formatRuntime(movie.runtime)]] as [string, React.ReactNode][]) : []),
    ...(tv
      ? ([
          ['Seasons', tv.number_of_seasons],
          ['Episodes', tv.number_of_episodes],
        ] as [string, React.ReactNode][])
      : []),
    ...(movie?.budget ? ([['Budget', formatCurrency(movie.budget)]] as [string, React.ReactNode][]) : []),
    ...(movie?.revenue ? ([['Box office', formatCurrency(movie.revenue)]] as [string, React.ReactNode][]) : []),
    ...((details.production_companies?.length ?? 0) > 0
      ? ([['Studios', details.production_companies!.slice(0, 4).map((c) => c.name).join(', ')]] as [string, React.ReactNode][])
      : []),
  ];

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
        onOpenTrailer={derived.trailer ? () => setModalVideo(derived.trailer!) : undefined}
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Sticky, borderless tab bar */}
        <div className="sticky top-16 lg:top-[72px] z-20 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 bg-bg/90 backdrop-blur-md">
          <Tabs items={tabs} value={activeTab} onChange={setTab} label="Title sections" />
        </div>

        <div className="pt-6 min-h-[40vh]" {...tabPanelProps(activeTab)} key={activeTab}>
          <div className="animate-fade-in">
            {activeTab === 'episodes' && tv && (
              <EpisodesPanel tvId={tv.id} seasons={derived.seasons} fallbackStill={tv.backdrop_path} historyItem={historyItem} />
            )}

            {activeTab === 'more' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-6">
                {derived.recommendations.map((item) => (
                  <MediaCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}

            {activeTab === 'videos' && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {derived.videos.slice(0, 16).map((vid) => (
                  <li key={vid.id}>
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
                      <span className="block mt-2 text-sm font-medium text-zinc-200 group-hover:text-white line-clamp-1">{vid.name}</span>
                      <span className="block text-xs text-subtle">{vid.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'cast' && <CastList cast={details.credits?.cast || []} crew={details.credits?.crew || []} />}

            {activeTab === 'details' && (
              <div className="grid lg:grid-cols-[1fr_320px] gap-10">
                <div>
                  {details.tagline && <p className="text-lg text-zinc-200 italic mb-4">&ldquo;{details.tagline}&rdquo;</p>}
                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">{details.overview}</p>
                  {details.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {details.genres.map((g) => (
                        <Link
                          key={g.id}
                          href={`/genre/${g.id}?type=${type}`}
                          className="h-9 px-4 inline-flex items-center rounded-full bg-white/8 hover:bg-white/14 text-xs font-semibold text-zinc-200 transition-colors"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-4 content-start">
                  {info
                    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== '—')
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-subtle">{label}</dt>
                        <dd className="text-sm text-zinc-100 mt-0.5">{value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </div>
        </div>
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
