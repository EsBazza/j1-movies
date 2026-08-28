import React from 'react';
import Link from 'next/link';
import { Clapperboard, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#05070b] border-t border-white/[0.06] pt-14 pb-24 md:pb-14 text-zinc-400 text-sm mt-24 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-red-600/5 blur-3xl pointer-events-none -z-0" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-white/[0.06]">
          <div className="flex flex-col gap-2.5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Clapperboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                J1<span className="text-red-500 ml-1">Movies</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Experience cinema-grade streaming with rich TMDB metadata, high-definition posters, and seamless Videasy playback.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold">
            <Link href="/" className="hover:text-red-400 transition-colors">Home</Link>
            <Link href="/movies" className="hover:text-red-400 transition-colors">Movies</Link>
            <Link href="/tv" className="hover:text-red-400 transition-colors">TV Series</Link>
            <Link href="/watchlist" className="hover:text-red-400 transition-colors">Watchlist</Link>
            <Link href="/search" className="hover:text-red-400 transition-colors">Search</Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p className="flex items-center gap-1.5 font-medium">
            <span>© {new Date().getFullYear()} J1 Movies. Powered by TMDB & Videasy.</span>
          </p>
          <p className="text-zinc-400 text-[11px]">
            Data provided by TMDB. This product is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
