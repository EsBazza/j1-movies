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
        className="flex items-start gap-5 sm:gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-none no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {topCast.map((person) => (
          <Link
            key={person.id}
            href={`/person/${person.id}`}
            className="w-20 sm:w-24 flex-shrink-0 flex flex-col items-center text-center group cursor-pointer"
          >
            {/* Circular Avatar Headshot */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-zinc-900 border border-white/15 group-hover:border-white/60 mb-2 transition-all duration-300 group-hover:scale-105 shadow-xl shadow-black/40">
              {person.profile_path ? (
                <Image
                  src={getImageUrl(person.profile_path, 'w185')}
                  alt={person.name}
                  fill
                  sizes="80px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                  <User className="w-7 h-7" />
                </div>
              )}
            </div>

            {/* Actor Name */}
            <span className="font-bold text-xs text-zinc-100 line-clamp-1 group-hover:text-white transition-colors">
              {person.name}
            </span>

            {/* Character Role */}
            <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
              {person.character || 'Cast'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
