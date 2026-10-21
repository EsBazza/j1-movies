'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LoadMoreProps {
  onLoadMore: () => void;
  isLoading: boolean;
  label?: string;
}

/**
 * Infinite scroll: loads the next page when this sentinel nears the viewport.
 * The button stays as a fallback (keyboard users, observer unsupported).
 */
export function LoadMore({ onLoadMore, isLoading, label = 'Load more' }: LoadMoreProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex justify-center py-10" aria-live="polite">
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted" aria-label="Loading more titles" />
      ) : (
        <Button variant="secondary" onClick={onLoadMore}>
          {label}
        </Button>
      )}
    </div>
  );
}
