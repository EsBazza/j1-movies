'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Tv, Bookmark, PlaySquare } from 'lucide-react';
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
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isScrolled
          ? 'glass-header py-3 border-b border-zinc-800/60 shadow-xl'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4 md:py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <PlaySquare className="w-5 h-5 text-white fill-white/20" />
            </div>
            <span className="text-xl font-extrabold tracking-wider text-white">
              J1<span className="text-red-500 font-normal">STREAM</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white bg-zinc-800/80 shadow-sm border border-zinc-700/50 font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[11px] font-bold rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
