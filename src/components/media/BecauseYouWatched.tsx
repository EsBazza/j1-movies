'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import { getRecommendations, normalizeUnique } from '@/lib/tmdb';
import { useUserStoreSelector } from '@/lib/store';
import { NormalizedMedia } from '@/types/tmdb';

/** "Because you watched X" — TMDB recommendations for the most recent title in local history. */
export function BecauseYouWatched({ fullWidth = false }: { fullWidth?: boolean }) {
  const history = useUserStoreSelector((s) => s.history);
  const seed = history[0];
  const [result, setResult] = useState<{ seedKey: string; items: NormalizedMedia[] } | null>(null);

  const seedKey = seed ? `${seed.type}-${seed.id}` : '';
  const watchedKeys = useMemo(() => new Set(history.map((h) => `${h.type}-${h.id}`)), [history]);

  useEffect(() => {
    if (!seed) return;
    let ignore = false;
    getRecommendations(seed.type, seed.id)
      .then((res) => {
        if (!ignore) setResult({ seedKey: `${seed.type}-${seed.id}`, items: normalizeUnique(res.results || [], seed.type) });
      })
      .catch(() => {
        if (!ignore) setResult({ seedKey: `${seed.type}-${seed.id}`, items: [] });
      });
    return () => {
      ignore = true;
    };
    // Re-fetch only when the most recent title changes, not on every progress update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  if (!seed || result?.seedKey !== seedKey) return null;
  const items = result.items.filter((i) => !watchedKeys.has(`${i.type}-${i.id}`) && i.posterPath).slice(0, 20);
  if (items.length < 4) return null;

  return <MediaCarousel title={`Because you watched ${seed.title}`} items={items} fullWidth={fullWidth} />;
}
