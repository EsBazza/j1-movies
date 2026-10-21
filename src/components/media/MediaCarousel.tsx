'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ScrollRow } from '@/components/ui/ScrollRow';

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
  if (!isLoading && items.length === 0) return null;

  const containerClass = fullWidth
    ? 'w-full'
    : 'max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16';

  return (
    <section
      className="relative w-full py-3"
      style={{ contentVisibility: 'auto', containIntrinsicSize: showRank ? '0 520px' : '0 420px' }}
    >
      {/* Header */}
      <div className={`${containerClass} flex items-center justify-between mb-4`}>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-accent" aria-hidden="true" />}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
        </div>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.08] text-xs font-semibold text-zinc-200 hover:text-white transition-all duration-200"
          >
            <span>View All</span>
            <span className="sr-only"> {title}</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
          </Link>
        )}
      </div>

      <ScrollRow label={title} className={containerClass} trackClassName="gap-4 sm:gap-6 py-4 px-2">
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
                    className="relative flex items-end flex-shrink-0 snap-start group/rank pl-6 sm:pl-10 pr-2 pt-2"
                  >
                    <span
                      aria-hidden="true"
                      className="ranked-number text-[140px] sm:text-[180px] md:text-[220px] absolute left-0 bottom-2 z-0 pointer-events-none select-none transition-transform duration-300 group-hover/rank:scale-105"
                    >
                      {rankNum}
                    </span>
                    <div className="w-[150px] sm:w-[175px] md:w-[200px] relative z-10 ml-12 sm:ml-16 md:ml-20">
                      <MediaCard item={item} rank={rankNum} />
                    </div>
                  </div>
                );
              }

              return (
                <div key={`${item.type}-${item.id}`} className="w-[150px] sm:w-[175px] md:w-[200px] flex-shrink-0 snap-start">
                  <MediaCard item={item} />
                </div>
              );
            })}
      </ScrollRow>
    </section>
  );
}

