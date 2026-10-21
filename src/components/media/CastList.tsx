import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { TMDBCastMember } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb';

interface CrewCredit {
  id: number;
  name: string;
  job: string;
}

interface CastListProps {
  cast: TMDBCastMember[];
  crew?: CrewCredit[];
}

const KEY_JOBS = ['Director', 'Creator', 'Screenplay', 'Writer', 'Novel', 'Original Music Composer', 'Director of Photography'];

/** Cast grid plus key crew; borderless, links to person pages. */
export function CastList({ cast, crew = [] }: CastListProps) {
  const topCast = cast.slice(0, 24);
  const keyCrew = crew
    .filter((c) => KEY_JOBS.includes(c.job))
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id && x.job === c.job) === i)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-12">
      {topCast.length > 0 && (
        <ul className="stagger grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-x-6 gap-y-10">
          {topCast.map((person, i) => (
            <li key={`${person.id}-${person.character}`} style={{ '--i': i } as React.CSSProperties}>
              <Link href={`/person/${person.id}`} className="group flex flex-col items-center text-center">
                <span className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-surface-2 transition-transform duration-300 ease-out-expo group-hover:scale-105">
                  {person.profile_path ? (
                    <Image src={getImageUrl(person.profile_path, 'w185')} alt="" fill sizes="96px" className="object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-subtle">
                      <User className="w-8 h-8" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="mt-3 text-sm font-medium text-zinc-100 group-hover:text-white line-clamp-1">{person.name}</span>
                {person.character && <span className="text-xs text-subtle line-clamp-1">{person.character}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {keyCrew.length > 0 && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
          {keyCrew.map((c) => (
            <div key={`${c.id}-${c.job}`}>
              <dt className="text-xs text-subtle">{c.job}</dt>
              <dd>
                <Link href={`/person/${c.id}`} className="text-sm font-medium text-zinc-100 hover:text-white">
                  {c.name}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
