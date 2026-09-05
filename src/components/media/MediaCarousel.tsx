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
}

export function MediaCarousel({
  title,
  items,
  icon: Icon,
  seeAllHref,
  isLoading = false,
  fullWidth = false,
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
      className="relative w-full py-4 group/carousel"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}
    >
      {/* Header */}
      <div className={`${containerClass} flex items-center justify-between mb-4`}>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-6 h-6 text-red-500" />}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h2>
        </div>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs md:text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            Explore All →
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
          className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-6 px-1"
        >
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-[170px] sm:w-[200px] md:w-[230px] flex-shrink-0">
                  <SkeletonCard />
                </div>
              ))
            : items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="w-[170px] sm:w-[200px] md:w-[230px] flex-shrink-0">
                  <MediaCard item={item} />
                </div>
              ))}
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

