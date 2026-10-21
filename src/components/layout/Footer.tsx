'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Only offer "back to top" once the user has scrolled a screen or so
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 800);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (pathname?.startsWith('/watch/')) {
    return null;
  }

  return (
    <footer className="w-full pt-16 pb-24 md:pb-16 text-zinc-400 text-xs mt-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-4">
        {/* Centered Logo & Branding */}
        <Link href="/" className="flex items-center gap-2 group rounded-lg">
          <Image
            src="/logo.png"
            alt="J1 Movies home"
            width={140}
            height={40}
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Minimal Legal / Disclaimer Text with Pop Animation */}
        <p className="text-xs text-zinc-400 max-w-lg leading-relaxed px-4 py-2">
          <strong className="text-zinc-300 font-bold">J1 Movies</strong> does not host, store, or distribute any media files on its servers. All metadata is powered by <strong className="text-zinc-300 font-bold">TMDB</strong>, and all streaming content is linked to third-party providers.
        </p>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-zinc-300 pt-1">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/movies" className="hover:text-white transition-colors">Movies</Link>
          <Link href="/tv" className="hover:text-white transition-colors">Shows</Link>
          <Link href="/watchlist" className="hover:text-white transition-colors">My List</Link>
          <Link href="/search" className="hover:text-white transition-colors">Search</Link>
        </nav>

        <p className="text-[11px] text-zinc-400 mt-2">
          © {new Date().getFullYear()} J1 Movies • Made with ❤️ by <strong className="text-zinc-300">bazza</strong>
        </p>
      </div>

      {/* Floating Scroll To Top Button */}
      {/* Sits above the mobile bottom nav on small screens */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[var(--z-nav)] w-11 h-11 rounded-full bg-zinc-900/85 hover:bg-zinc-800 text-zinc-200 hover:text-white backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 animate-fade-in"
        >
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </footer>
  );
}
