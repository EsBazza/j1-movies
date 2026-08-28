import React from 'react';
import Link from 'next/link';
import { Film, PlaySquare, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-900 pt-12 pb-24 md:pb-12 text-zinc-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-zinc-800/60">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <PlaySquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-wider text-white">
                J1<span className="text-red-500 font-normal">STREAM</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm">
              Discover and stream popular movies & TV shows powered by TMDB metadata and Videasy embed player.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/movies" className="hover:text-white transition-colors">Movies Catalog</Link>
            <Link href="/tv" className="hover:text-white transition-colors">TV Shows</Link>
            <Link href="/watchlist" className="hover:text-white transition-colors">My Watchlist</Link>
            <Link href="/search" className="hover:text-white transition-colors">Search</Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p className="flex items-center gap-1">
            Crafted for personal cinema viewing.
          </p>
          <p className="text-zinc-400">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Video playback provided via Videasy.
          </p>
        </div>
      </div>
    </footer>
  );
}
