'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Film,
  Tv,
  Bookmark,
  Search,
} from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
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

  if (pathname?.startsWith('/watch')) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
      <div className="w-full px-6 sm:px-10 lg:px-12 pt-4 sm:pt-6 flex items-center justify-between gap-4">
        {/* Top-Left: Brand Logo (Positioned at far top-left) */}
        <div className="flex items-center pointer-events-auto">
          <Link
            href="/"
            className="flex items-center group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <div className="relative h-9 sm:h-11 md:h-12 flex items-center">
              <Image
                src="/logo.png"
                alt="J1 Movies"
                width={190}
                height={50}
                priority
                className="h-8 sm:h-10 md:h-11 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
              />
            </div>
          </Link>
        </div>

        {/* Top-Right: Floating Glass Pill Navbar (Visible on md+ screens) */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto">
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
