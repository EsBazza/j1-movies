'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TMDBCastMember } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';

interface CastListProps {
  cast: TMDBCastMember[];
}

export function CastList({ cast }: CastListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!cast || cast.length === 0) return null;

  const topCast = cast.slice(0, 18);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Cast</h3>
        {topCast.length > 6 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex items-start gap-6 sm:gap-8 overflow-x-auto pb-4 scroll-smooth scrollbar-none no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {topCast.map((person) => (
          <Link
            key={person.id}
            href={`/person/${person.id}`}
            className="w-24 sm:w-28 md:w-32 flex-shrink-0 flex flex-col items-center text-center group cursor-pointer"
          >
            {/* Circular Avatar Headshot */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-zinc-900 border border-white/20 group-hover:border-white/70 mb-3 transition-all duration-300 group-hover:scale-105 shadow-2xl shadow-black/60">
              {person.profile_path ? (
                <Image
                  src={getImageUrl(person.profile_path, 'w185')}
                  alt={person.name}
                  fill
                  sizes="120px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                  <User className="w-9 h-9" />
                </div>
              )}
            </div>

            {/* Actor Name */}
            <span className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-white transition-colors">
              {person.name}
            </span>

            {/* Character Role */}
            <span className="text-xs text-zinc-400 line-clamp-1 mt-0.5 font-medium">
              {person.character || 'Cast'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
