'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, X, Shuffle } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { openSurpriseMe } from '@/components/common/SurpriseMe';
import { IconButton } from '@/components/ui/Button';
import { useUserStoreSelector } from '@/lib/store';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Movies', href: '/movies' },
  { label: 'Series', href: '/tv' },
  { label: 'Anime', href: '/anime' },
  { label: 'K-Drama', href: '/kdrama' },
  { label: 'Reels', href: '/reels' },
  { label: 'My List', href: '/watchlist' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const watchlistCount = useUserStoreSelector((s) => s.watchlist.length);

  // Close search on navigation (adjusting state during render, not in an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // "/" opens search from anywhere (except while typing in a field)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      e.preventDefault();
      if (window.matchMedia('(min-width: 1024px)').matches) setIsSearchOpen(true);
      else window.location.assign('/search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Full-screen experiences render their own chrome
  if (pathname?.startsWith('/watch/') || pathname === '/reels') {
    return null;
  }

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-[var(--z-nav)] transition-[background-color] duration-300',
        isScrolled ? 'bg-bg/92 backdrop-blur-md' : 'bg-gradient-to-b from-black/70 to-transparent'
      )}
    >
      <div className="max-w-[1800px] mx-auto h-16 lg:h-[72px] px-4 sm:px-8 lg:px-12 flex items-center gap-6">
        <Link href="/" className="flex-shrink-0 rounded-md">
          <Image
            src="/logo.png"
            alt="J1 Movies home"
            width={150}
            height={40}
            priority
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                )}
              >
                {link.label}
                {link.href === '/watchlist' && watchlistCount > 0 && (
                  <span className="ml-1.5 text-[11px] font-bold text-accent">
                    {watchlistCount}
                    <span className="sr-only"> saved</span>
                  </span>
                )}
                {isActive && (
                  <span aria-hidden="true" className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-accent animate-fade-in" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {isSearchOpen ? (
            <div className="hidden lg:flex items-center gap-2 animate-fade-in">
              <SearchBar autoFocus onDone={() => setIsSearchOpen(false)} className="w-[360px] max-w-none" />
              <IconButton aria-label="Close search" variant="ghost" size="sm" onClick={() => setIsSearchOpen(false)}>
                <X className="w-4 h-4" aria-hidden="true" />
              </IconButton>
            </div>
          ) : (
            <IconButton
              aria-label="Search (press /)"
              title="Search (/)"
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:inline-flex"
            >
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </IconButton>
          )}
          <button
            type="button"
            onClick={openSurpriseMe}
            className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-full bg-white/10 hover:bg-white/18 text-white text-xs font-semibold transition-colors"
          >
            <Shuffle className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Surprise me</span>
            <span className="sm:hidden sr-only">Surprise me</span>
          </button>
        </div>
      </div>
    </header>
  );
}
