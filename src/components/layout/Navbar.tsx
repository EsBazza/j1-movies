'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Film,
  Tv,
  Bookmark,
  Clapperboard,
  Search,
  ArrowLeft,
  Settings,
  Sparkles,
} from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { watchlist, hasHydrated } = useUserStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'Shows', href: '/tv', icon: Tv },
    {
      label: 'My List',
      href: '/watchlist',
      icon: Bookmark,
      badge: hasHydrated && watchlist.length > 0 ? watchlist.length : undefined,
    },
  ];

  const showBackButton = pathname !== '/' && !pathname.startsWith('/#');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex items-center justify-between gap-4">
        {/* Top-Left: Minimal Back Button & Brand Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              title="Go back"
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-zinc-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 transition-all shadow-xl group cursor-pointer"
          >
            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-md shadow-red-600/40">
              <Clapperboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black tracking-tight text-white group-hover:text-red-400 transition-colors">
              J1<span className="text-red-500">.</span>
            </span>
          </Link>
        </div>

        {/* Top-Right: Floating Glass Pill Navbar (CineJoy Style) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isSearchOpen ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <SearchBar />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-3 py-2 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold backdrop-blur-xl border border-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-zinc-900/70 hover:bg-zinc-900/85 backdrop-blur-2xl p-1 rounded-full border border-white/10 shadow-2xl shadow-black/80 transition-all">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer',
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/20 font-bold'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {Icon && (
                      <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-black fill-black' : 'text-zinc-400')} />
                    )}
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span
                        className={cn(
                          'ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full',
                          isActive ? 'bg-black text-white' : 'bg-red-600 text-white'
                        )}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="h-4 w-px bg-zinc-700/60 mx-1" />

              {/* Search Trigger Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Search movies and series"
                className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
