'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pathname?.startsWith('/watch')) {
    return null;
  }

  return (
    <footer className="w-full pt-16 pb-24 md:pb-16 text-zinc-400 text-xs mt-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-4">
        {/* Centered Logo & Branding */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <Image
            src="/logo.png"
            alt="J1 Movies"
            width={140}
            height={40}
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Minimal Legal / Disclaimer Text with Pop Animation */}
        <p className="group/disclaimer text-[11px] text-zinc-400 max-w-lg leading-relaxed px-4 py-2 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(229,9,20,0.12)] hover:text-zinc-200 transform hover:scale-[1.03] transition-all duration-300 cursor-default select-none">
          <strong className="text-zinc-300 font-bold group-hover/disclaimer:text-white transition-colors">J1 Movies</strong> does not host, store, or distribute any media files on its servers. All metadata is powered by <strong className="text-zinc-300 font-bold group-hover/disclaimer:text-red-400 transition-colors">TMDB</strong>, and all streaming content is linked to third-party providers.
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
