import React from 'react';
import Image from 'next/image';
import { TMDBCastMember } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { User } from 'lucide-react';

interface CastListProps {
  cast: TMDBCastMember[];
}

export function CastList({ cast }: CastListProps) {
  if (!cast || cast.length === 0) return null;

  const topCast = cast.slice(0, 12);

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-white mb-4">Top Cast & Crew</h3>
      <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-3">
        {topCast.map((person) => (
          <div key={person.id} className="w-24 sm:w-28 flex-shrink-0 flex flex-col items-center text-center group">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700/60 mb-2 group-hover:border-red-500 transition-colors shadow-md">
              {person.profile_path ? (
                <Image
                  src={getImageUrl(person.profile_path, 'w185')}
                  alt={person.name}
                  fill
                  sizes="96px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <span className="font-semibold text-xs text-zinc-200 line-clamp-1 group-hover:text-red-400 transition-colors">
              {person.name}
            </span>
            <span className="text-[11px] text-zinc-500 line-clamp-1">
              {person.character || 'Cast'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
