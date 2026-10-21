'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollRowProps {
  children: React.ReactNode;
  /** Accessible name for the scroll region, e.g. the row title */
  label: string;
  className?: string;
  trackClassName?: string;
}

const arrowClass =
  'absolute top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/75 hover:bg-white hover:text-black text-white flex items-center justify-center shadow-2xl transition-all duration-300 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 disabled:!opacity-0 disabled:pointer-events-none [@media(hover:none)]:hidden';

/**
 * Horizontal scroll track with arrow buttons that hide at the edges and when
 * content doesn't overflow. Touch devices scroll natively with snap points.
 */
export function ScrollRow({ children, label, className, trackClassName }: ScrollRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, [updateEdges]);

  const scrollBy = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative group/row', className)}>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canScrollLeft}
        aria-label={`Scroll ${label} left`}
        className={cn(arrowClass, 'left-0 md:-left-4')}
      >
        <ChevronLeft className="w-6 h-6" aria-hidden="true" />
      </button>

      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        className={cn(
          'flex items-stretch overflow-x-auto no-scrollbar scroll-smooth snap-x snap-proximity overscroll-x-contain',
          trackClassName
        )}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canScrollRight}
        aria-label={`Scroll ${label} right`}
        className={cn(arrowClass, 'right-0 md:-right-4')}
      >
        <ChevronRight className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>
  );
}
