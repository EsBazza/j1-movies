'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X } from 'lucide-react';
import { useUserStoreSelector, userStoreActions } from '@/lib/store';
import { WatchHistoryItem } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb';
import { formatRuntime } from '@/lib/utils';
import { ScrollRow } from '@/components/ui/ScrollRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { toast } from '@/components/ui/Toast';
import { useReveal } from '@/lib/useReveal';

function ContinueCard({ item, onRemove }: { item: WatchHistoryItem; onRemove: (item: WatchHistoryItem) => void }) {
  const [imageError, setImageError] = useState(false);
  // Details first: the details page highlights Resume when opened with #resume
  const href = `/details/${item.type}/${item.id}#resume`;
  const remainingMins =
    item.durationSeconds && item.progressSeconds
      ? Math.max(1, Math.round((item.durationSeconds - item.progressSeconds) / 60))
      : 0;
  const subtitle =
    item.type === 'tv' && item.season && item.episode ? `S${item.season} · E${item.episode}` : 'Movie';

  return (
    <div className="group/cw relative w-[72vw] max-w-[320px] sm:w-[300px] flex-shrink-0 snap-start">
      <Link href={href} className="block" aria-label={`${item.title}, ${subtitle}${remainingMins ? `, ${remainingMins} minutes left` : ''}`}>
        <div className="relative aspect-video rounded-card overflow-hidden bg-surface-2 transition-transform duration-300 ease-out-expo group-hover/cw:scale-[1.02]">
          <Image
            src={
              imageError
                ? getPosterUrl(item.poster_path, 'w500')
                : getBackdropUrl(item.backdrop_path || item.poster_path, 'w780')
            }
            alt=""
            fill
            sizes="(max-width: 640px) 72vw, 300px"
            onError={() => setImageError(true)}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cw:opacity-100 transition-opacity duration-300">
            <span className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center">
              <Play className="w-5 h-5 fill-black ml-0.5" aria-hidden="true" />
            </span>
          </span>
          <div className="absolute left-3 right-3 bottom-3" aria-hidden="true">
            <p className="text-sm font-semibold text-white truncate">{item.title}</p>
            <p className="text-xs text-zinc-300 mt-0.5">
              {subtitle}
              {remainingMins ? ` · ${formatRuntime(remainingMins)} left` : ''}
            </p>
          </div>
          {item.progressPercent ? (
            <span className="absolute bottom-0 inset-x-0 h-1 bg-white/15" aria-hidden="true">
              <span className="block h-full bg-accent" style={{ width: `${Math.max(3, item.progressPercent)}%` }} />
            </span>
          ) : null}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.title} from Continue Watching`}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-100 [@media(hover:hover)]:opacity-0 group-hover/cw:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ContinueWatchingRow({ className }: { className?: string }) {
  const history = useUserStoreSelector((s) => s.history);
  const revealRef = useReveal<HTMLElement>();
  // Finished movies drop out; series stay so the next episode is one tap away
  const items = useMemo(() => history.filter((h) => !(h.type === 'movie' && h.finished)).slice(0, 15), [history]);

  const handleRemove = (item: WatchHistoryItem) => {
    userStoreActions.removeFromHistory(item.id, item.type);
    toast(`Removed "${item.title}"`, {
      tone: 'info',
      action: { label: 'Undo', onClick: () => userStoreActions.restoreHistoryItem(item) },
    });
  };

  if (items.length === 0) return null;

  return (
    <section ref={revealRef} className={`reveal ${className ?? ''}`} aria-labelledby="continue-watching-heading">
      <SectionHeader id="continue-watching-heading" title="Continue watching" href="/watchlist?tab=history" linkLabel="History" />
      <ScrollRow label="Continue watching" trackClassName="gap-3 sm:gap-4 py-2 -my-2">
        {items.map((item) => (
          <ContinueCard key={`${item.type}-${item.id}`} item={item} onRemove={handleRemove} />
        ))}
      </ScrollRow>
    </section>
  );
}
