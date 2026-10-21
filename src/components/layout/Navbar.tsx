'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Shuffle } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { openSurpriseMe } from '@/components/common/SurpriseMe';
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

// Frosted glass tinted with the live palette (follows the trailer/poster colours)
const GLASS =
  'bg-[color-mix(in_srgb,var(--dyn-glow-1)_20%,rgb(10_10_11/0.55))] backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_10px_30px_rgb(0_0_0/0.35)]';

const HIDE_AFTER_PX = 160;
const SCROLL_SLOP_PX = 6;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastYRef = useRef(0);
  const watchlistCount = useUserStoreSelector((s) => s.watchlist.length);

  // Close search on navigation (adjusting state during render, not in an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsSearchOpen(false);
    setIsHidden(false);
  }

  // Slide away while scrolling down, come back on any upward scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      if (Math.abs(delta) < SCROLL_SLOP_PX) return;
      setIsHidden(delta > 0 && y > HIDE_AFTER_PX);
      lastYRef.current = y;
    };
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
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setIsHidden(false);
        setIsSearchOpen(true);
      } else router.push('/search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  // Full-screen experiences render their own chrome
  if (pathname?.startsWith('/watch/') || pathname === '/reels') {
    return null;
  }

  const hidden = isHidden && !isSearchOpen;

  return (
    <header
      onFocusCapture={() => setIsHidden(false)}
      className={cn(
        'fixed top-0 inset-x-0 z-[var(--z-nav)] pointer-events-none',
        'transition-[transform,opacity] duration-500 ease-out-expo',
        hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <div className="relative max-w-[1800px] mx-auto h-16 lg:h-20 px-5 sm:px-10 lg:px-16 flex items-center justify-between gap-4">
        <Link href="/" className="pointer-events-auto flex-shrink-0 rounded-md">
          <Image
            src="/logo.png"
            alt="J1 Movies home"
            width={150}
            height={40}
            priority
            className="h-7 sm:h-8 w-auto object-contain drop-shadow-[0_2px_10px_rgb(0_0_0/0.6)]"
          />
        </Link>

        {/* Centre capsule: links, or the search field when open */}
        <div
          className={cn(
            'hidden lg:flex pointer-events-auto absolute left-1/2 -translate-x-1/2 items-center h-12 rounded-full px-1.5 transition-[background-color] duration-700',
            GLASS
          )}
        >
          {isSearchOpen ? (
            <div className="flex items-center gap-1 pl-1 animate-fade-in">
              <SearchBar
                autoFocus
                onDone={() => setIsSearchOpen(false)}
                className="w-[440px] max-w-none [&_input]:bg-transparent [&_input]:hover:bg-transparent [&_input]:focus:bg-transparent [&_input]:border-transparent"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <nav aria-label="Main" className="flex items-center">
              {LINKS.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative h-9 px-4 inline-flex items-center rounded-full text-sm font-medium transition-colors duration-200',
                      isActive ? 'bg-white/15 text-white' : 'text-zinc-300 hover:text-white hover:bg-white/8'
                    )}
                  >
                    {link.label}
                    {link.href === '/watchlist' && watchlistCount > 0 && (
                      <span className="ml-1.5 min-w-5 h-5 px-1 rounded-full bg-accent text-on-accent text-[11px] font-bold inline-flex items-center justify-center">
                        {watchlistCount}
                        <span className="sr-only"> saved</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: search + surprise in matching glass */}
        <div className="pointer-events-auto flex items-center gap-2">
          {!isSearchOpen && (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search (press /)"
              title="Search (/)"
              className={cn(
                'hidden lg:inline-flex w-12 h-12 rounded-full items-center justify-center text-white transition-[background-color] duration-700 hover:brightness-125',
                GLASS
              )}
            >
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={openSurpriseMe}
            className={cn(
              'h-10 lg:h-12 px-4 lg:px-5 rounded-full inline-flex items-center gap-2 text-white text-sm font-semibold transition-[background-color] duration-700 hover:brightness-125',
              GLASS
            )}
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
