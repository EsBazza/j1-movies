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
}

export function MediaCarousel({
  title,
  items,
  icon: Icon,
  seeAllHref,
  isLoading = false,
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

  return (
    <section className="relative w-full py-4 group">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-red-500" />}
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">{title}</h2>
        </div>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs md:text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
          >
            Explore All →
          </Link>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          className="absolute -left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl border border-white/10 cursor-pointer disabled:opacity-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[160px] sm:w-[190px] md:w-[210px] flex-shrink-0">
                  <SkeletonCard />
                </div>
              ))
            : items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="w-[160px] sm:w-[190px] md:w-[210px] flex-shrink-0">
                  <MediaCard item={item} />
                </div>
              ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          className="absolute -right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl border border-white/10 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
