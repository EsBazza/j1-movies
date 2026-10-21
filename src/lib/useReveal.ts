'use client';

import { useCallback } from 'react';

// One observer for the whole app instead of one per section
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = 'true';
            observer?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
  }
  return observer;
}

/**
 * Ref callback that fades an element in the first time it scrolls into view.
 * Use with the `.reveal` class: `<section ref={useReveal()} className="reveal">`.
 */
export function useReveal<T extends HTMLElement>() {
  return useCallback((node: T | null) => {
    if (!node) return;
    const obs = getObserver();
    if (!obs) {
      node.dataset.revealed = 'true';
      return;
    }
    obs.observe(node);
    return () => obs.unobserve(node);
  }, []);
}
