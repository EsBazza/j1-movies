'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

interface MediaCarouselProps {
  title: string;
  items: NormalizedMedia[];
  icon?: LucideIcon;
  seeAllHref?: string;
  isLoading?: boolean;
  fullWidth?: boolean;
  showRank?: boolean;
}

export function MediaCarousel({
  title,
  items,
  icon: Icon,
  seeAllHref,
  isLoading = false,
  fullWidth = false,
  showRank = false,
}: MediaCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  if (!isLoading && items.length === 0) return null;

  const containerClass = fullWidth
    ? 'w-full'
    : 'max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16';

  return (
    <section
      className="relative w-full py-3 group/carousel"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}
    >
      {/* Header */}
      <div className={`${containerClass} flex items-center justify-between mb-4`}>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-red-500" />}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
        </div>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.08] text-xs font-semibold text-zinc-200 hover:text-white transition-all duration-200"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        )}
      </div>

      {/* Carousel Container */}
      <div className={`relative ${containerClass}`}>
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          className="absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/85 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 shadow-2xl border border-white/15 cursor-pointer hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-4 px-2"
        >
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-[150px] sm:w-[175px] md:w-[200px] flex-shrink-0">
                  <SkeletonCard />
                </div>
              ))
            : items.map((item, index) => {
                const rankNum = index + 1;
                if (showRank && rankNum <= 10) {
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="relative flex items-end flex-shrink-0 group/rank pl-6 sm:pl-10 pr-2 pt-2"
                    >
                      {/* Big Bold Ranked Number - Giant solid white letter overlapping from behind */}
                      <span className="ranked-number text-[140px] sm:text-[180px] md:text-[220px] absolute left-0 bottom-2 z-0 pointer-events-none select-none transition-transform duration-300 group-hover/rank:scale-105">
                        {rankNum}
                      </span>
                      {/* Vertical Poster Card positioned over the right side of the number */}
                      <div className="w-[150px] sm:w-[175px] md:w-[200px] relative z-10 ml-12 sm:ml-16 md:ml-20">
                        <MediaCard item={item} rank={rankNum} />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="w-[150px] sm:w-[175px] md:w-[200px] flex-shrink-0"
                  >
                    <MediaCard item={item} />
                  </div>
                );
              })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          className="absolute -right-3 md:-right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/85 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 shadow-2xl border border-white/15 cursor-pointer hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}

