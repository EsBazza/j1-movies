'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { NormalizedMedia } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ScrollRow } from '@/components/ui/ScrollRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useReveal } from '@/lib/useReveal';
import { cn } from '@/lib/utils';

interface MediaCarouselProps {
  title: string;
  subtitle?: string;
  items: NormalizedMedia[];
  /** @deprecated decorative heading icons were removed in the redesign */
  icon?: LucideIcon;
  seeAllHref?: string;
  isLoading?: boolean;
  /** Render without the page gutter (when the parent already provides it) */
  fullWidth?: boolean;
  showRank?: boolean;
}

export const PAGE_GUTTER = 'max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12';
const CARD_WIDTH = 'w-[38vw] max-w-[180px] sm:w-[160px] sm:max-w-none lg:w-[185px]';

export function MediaCarousel({
  title,
  subtitle,
  items,
  seeAllHref,
  isLoading = false,
  fullWidth = false,
  showRank = false,
}: MediaCarouselProps) {
  const revealRef = useReveal<HTMLElement>();

  if (!isLoading && items.length === 0) return null;

  const gutter = fullWidth ? '' : PAGE_GUTTER;

  return (
    <section
      ref={revealRef}
      className="reveal relative w-full"
      style={{ contentVisibility: 'auto', containIntrinsicSize: showRank ? '0 420px' : '0 380px' }}
    >
      <div className={gutter}>
        <SectionHeader title={title} subtitle={subtitle} href={seeAllHref} />
      </div>

      <ScrollRow label={title} className={gutter} trackClassName="gap-3 sm:gap-4 py-2 -my-2 scroll-px-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn(CARD_WIDTH, 'flex-shrink-0')}>
                <SkeletonCard />
              </div>
            ))
          : items.map((item, index) => {
              const rank = index + 1;
              if (showRank && rank <= 10) {
                return (
                  <div key={`${item.type}-${item.id}`} className="relative flex items-end flex-shrink-0 snap-start pl-2">
                    <span
                      aria-hidden="true"
                      className="ranked-number text-[110px] sm:text-[150px] lg:text-[170px] -mr-4 sm:-mr-6 mb-12 z-0"
                    >
                      {rank}
                    </span>
                    <div className={cn(CARD_WIDTH, 'relative z-10')}>
                      <MediaCard item={item} rank={rank} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={`${item.type}-${item.id}`} className={cn(CARD_WIDTH, 'flex-shrink-0 snap-start')}>
                  <MediaCard item={item} />
                </div>
              );
            })}
      </ScrollRow>
    </section>
  );
}
