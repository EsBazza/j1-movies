'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, ArrowUp } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full pt-16 pb-24 md:pb-16 text-zinc-400 text-xs mt-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-4">
        {/* Centered Logo & Branding */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Clapperboard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-black tracking-tight text-white group-hover:text-red-400 transition-colors">
            J1<span className="text-red-500">MOVIES</span>
          </span>
        </Link>

        {/* Minimal Legal / Disclaimer Text */}
        <p className="text-[11px] text-zinc-400 max-w-lg leading-relaxed">
          J1 Movies does not host, store, or distribute any media files on its servers. All metadata is powered by TMDB, and all streaming content is linked to third-party providers.
        </p>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-semibold text-zinc-300 pt-1">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/movies" className="hover:text-white transition-colors">Movies</Link>
          <Link href="/tv" className="hover:text-white transition-colors">Shows</Link>
          <Link href="/watchlist" className="hover:text-white transition-colors">My List</Link>
          <Link href="/search" className="hover:text-white transition-colors">Search</Link>
        </div>

        <p className="text-[10px] text-zinc-400 mt-2">
          © {new Date().getFullYear()} J1 Movies • Made with ❤️ by <strong className="text-zinc-300">bazza</strong>
        </p>
      </div>

      {/* Floating Scroll To Top Button */}
      <button
        onClick={scrollToTop}
        title="Scroll to top"
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-all hover:scale-110 cursor-pointer"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </footer>
  );
}
