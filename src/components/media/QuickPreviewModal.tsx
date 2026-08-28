'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Clock, Film, Tv, Youtube, X, Bookmark } from 'lucide-react';
import { NormalizedMedia, TMDBVideo } from '@/types/tmdb';
import { getBackdropUrl, getPosterUrl, getMovieDetails, getTVDetails } from '@/lib/tmdb';
import { formatYear } from '@/lib/utils';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { Badge } from '@/components/ui/Badge';

interface QuickPreviewModalProps {
  item: NormalizedMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickPreviewModal({ item, isOpen, onClose }: QuickPreviewModalProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!item || !isOpen) {
      setTrailerKey(null);
      setIsPlayingTrailer(false);
      return;
    }

    async function loadTrailer() {
      if (!item) return;
      setIsLoadingDetails(true);
      try {
        const details =
          item.type === 'movie'
            ? await getMovieDetails(item.id)
            : await getTVDetails(item.id);

        const trailer = details.videos?.results?.find(
          (v: TMDBVideo) =>
            v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );

        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (err) {
        console.error('Failed to load quick preview trailer:', err);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadTrailer();
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#090d16] border border-zinc-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/70 hover:bg-red-600 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video or Backdrop Header */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {isPlayingTrailer && trailerKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title="Trailer Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <>
              <Image
                src={getBackdropUrl(item.backdropPath || item.posterPath, 'w1280')}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-cover brightness-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-black/30" />

              {/* Play Trailer CTA */}
              {trailerKey && (
                <button
                  onClick={() => setIsPlayingTrailer(true)}
                  className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl shadow-red-600/50 group-hover:scale-110 group-hover:bg-red-600 transition-all border border-red-400/40">
                    <Play className="w-6 h-6 fill-white ml-1" />
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="accent" className="capitalize font-bold">
              {item.type === 'movie' ? 'Movie' : 'TV Series'}
            </Badge>
            {item.rating > 0 && (
              <Badge variant="rating" className="flex items-center gap-1 bg-black/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{item.rating}</span>
              </Badge>
            )}
            {item.releaseDate && (
              <Badge variant="outline" className="bg-black/40">
                <Calendar className="w-3 h-3 mr-1" />
                {formatYear(item.releaseDate)}
              </Badge>
            )}
            <Badge variant="hd">1080p Full HD</Badge>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {item.title}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
            {item.overview || 'No synopsis provided.'}
          </p>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <Link
                href={`/watch/${item.type}/${item.id}`}
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Stream Cinema</span>
              </Link>

              <Link
                href={`/details/${item.type}/${item.id}`}
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs border border-zinc-700 transition-colors"
              >
                Full Details
              </Link>
            </div>

            <BookmarkButton
              item={{
                id: item.id,
                type: item.type,
                title: item.title,
                poster_path: item.posterPath,
                backdrop_path: item.backdropPath,
                vote_average: item.rating,
                release_date: item.releaseDate,
              }}
              variant="button"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
