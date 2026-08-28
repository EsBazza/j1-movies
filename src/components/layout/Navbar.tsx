'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Tv, Bookmark, Clapperboard, Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
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
    { label: 'TV Shows', href: '/tv', icon: Tv },
    {
      label: 'Watchlist',
      href: '/watchlist',
      icon: Bookmark,
      badge: hasHydrated && watchlist.length > 0 ? watchlist.length : undefined,
    },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
        isScrolled
          ? 'glass-header py-3 shadow-2xl shadow-black/80'
          : 'bg-gradient-to-b from-[#07090e]/95 via-[#07090e]/50 to-transparent py-4 md:py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/40 border border-red-400/30 group-hover:scale-105 transition-transform duration-300">
              <Clapperboard className="w-5 h-5 text-white" />
              <div className="absolute -inset-1 rounded-xl bg-red-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-red-50 transition-colors">
                  J1<span className="text-red-500 ml-1">Movies</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest -mt-0.5">
                Cinema Streaming
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300',
                    isActive
                      ? 'text-white bg-red-600/15 border border-red-500/40 shadow-sm shadow-red-950/40'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  )}
                >
                  {Icon && <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-red-500' : 'text-zinc-400')} />}
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search Bar with glowing focus */}
        <div className="flex items-center gap-3">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
