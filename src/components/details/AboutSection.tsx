import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TMDBMovieDetails, TMDBTVDetails } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { formatCurrency, formatDateFull, formatRuntime } from '@/lib/utils';

interface AboutSectionProps {
  details: TMDBMovieDetails | TMDBTVDetails;
  type: 'movie' | 'tv';
}

interface FactItem {
  label: string;
  value?: React.ReactNode;
  note?: string;
}

function languageName(code?: string): string | undefined {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function Fact({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-panel bg-white/[0.04] px-5 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{label}</dt>
      <dd className="mt-1.5 text-base font-semibold text-white">
        {value}
        {note && <span className="block text-xs font-medium text-accent mt-0.5">{note}</span>}
      </dd>
    </div>
  );
}

/** Tagline, overview, credits, genres, key facts and studio logos — no divider lines. */
export function AboutSection({ details, type }: AboutSectionProps) {
  const movie = type === 'movie' ? (details as TMDBMovieDetails) : null;
  const tv = type === 'tv' ? (details as TMDBTVDetails & { created_by?: { id: number; name: string }[] }) : null;

  const directors = (details.credits?.crew || []).filter((c) => c.job === 'Director').slice(0, 2);
  const creators = tv?.created_by?.slice(0, 2) ?? [];
  const people = type === 'movie' ? directors : creators;
  const peopleLabel = type === 'movie' ? 'Directed by' : 'Created by';

  const boxOfficeMultiple =
    movie?.budget && movie.revenue && movie.budget > 0 ? Math.round((movie.revenue / movie.budget) * 10) / 10 : null;

  const candidates: (FactItem | null)[] = [
    { label: type === 'movie' ? 'Released' : 'First aired', value: formatDateFull(movie?.release_date || tv?.first_air_date) },
    movie?.runtime ? { label: 'Runtime', value: formatRuntime(movie.runtime) } : null,
    tv
      ? {
          label: 'Seasons',
          value: `${tv.number_of_seasons} ${tv.number_of_seasons === 1 ? 'season' : 'seasons'}`,
          note: `${tv.number_of_episodes} episodes`,
        }
      : null,
    { label: 'Language', value: languageName(details.original_language) },
    { label: 'Status', value: details.status },
    movie?.budget ? { label: 'Budget', value: formatCurrency(movie.budget) } : null,
    movie?.revenue
      ? {
          label: 'Box office',
          value: formatCurrency(movie.revenue),
          note: boxOfficeMultiple && boxOfficeMultiple >= 1.5 ? `${boxOfficeMultiple}× its budget` : undefined,
        }
      : null,
  ];
  const facts = candidates.filter((f): f is FactItem => Boolean(f && f.value));

  const studios = (details.production_companies || []).slice(0, 6);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-12 lg:gap-20">
      <div>
        {details.tagline && (
          <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight max-w-2xl">
            <span className="text-accent" aria-hidden="true">
              &ldquo;
            </span>
            {details.tagline.replace(/^["“]|["”]$/g, '')}
            <span className="text-accent" aria-hidden="true">
              &rdquo;
            </span>
          </p>
        )}

        {details.overview && (
          <p className={`${details.tagline ? 'mt-6' : ''} text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl`}>
            {details.overview}
          </p>
        )}

        {people.length > 0 && (
          <p className="mt-6 text-sm text-muted">
            {peopleLabel}{' '}
            {people.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && ' & '}
                <Link href={`/person/${p.id}`} className="font-semibold text-white hover:text-accent transition-colors">
                  {p.name}
                </Link>
              </React.Fragment>
            ))}
          </p>
        )}

        {details.genres?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {details.genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${g.id}?type=${type}`}
                className="h-9 px-4 inline-flex items-center rounded-full bg-white/8 hover:bg-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <dl className="grid grid-cols-2 gap-3">
          {facts.map((f) => (
            <Fact key={f.label} label={f.label} value={f.value} note={f.note} />
          ))}
        </dl>

        {studios.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle mb-4">Studios</p>
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-5">
              {studios.map((c) =>
                c.logo_path ? (
                  <li key={c.id} className="relative h-7 w-24" title={c.name}>
                    {/* Logos come in mixed colours; render them as white marks */}
                    <Image
                      src={getImageUrl(c.logo_path, 'w185')}
                      alt={c.name}
                      fill
                      sizes="96px"
                      className="object-contain object-left brightness-0 invert opacity-75"
                    />
                  </li>
                ) : (
                  <li key={c.id} className="text-sm font-semibold text-zinc-300">
                    {c.name}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
