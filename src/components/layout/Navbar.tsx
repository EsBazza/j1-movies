'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Film, Tv, Bookmark, Sparkles, Heart, Search, X } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { Modal } from '@/components/ui/Modal';
import { useUserStoreSelector } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const watchlistCount = useUserStoreSelector((s) => s.watchlist.length);

  // "/" focuses search from anywhere (except while typing in a field)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      e.preventDefault();
      if (window.matchMedia('(min-width: 768px)').matches) setIsSearchOpen(true);
      else setIsMobileSearchOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close search panels on navigation (adjusting state during render, not in an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  }

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'Series', href: '/tv', icon: Tv },
    { label: 'Anime', href: '/anime', icon: Sparkles },
    { label: 'K-Drama', href: '/kdrama', icon: Heart },
    { label: 'My List', href: '/watchlist', icon: Bookmark, badge: watchlistCount > 0 ? watchlistCount : undefined },
  ];

  if (pathname?.startsWith('/watch/')) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[var(--z-nav)] pointer-events-none">
      <div className="w-full px-4 sm:px-10 lg:px-12 pt-4 sm:pt-6 flex items-center justify-between gap-4">
        <div className="flex items-center pointer-events-auto">
          <Link href="/" className="flex items-center group transition-transform hover:scale-105 active:scale-95 rounded-lg">
            <div className="relative h-9 sm:h-11 md:h-12 flex items-center">
              <Image
                src="/logo.png"
                alt="J1 Movies home"
                width={190}
                height={50}
                priority
                className="h-8 sm:h-10 md:h-11 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
              />
            </div>
          </Link>
        </div>

        {/* Mobile: search button opens a full-screen search sheet */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          aria-label="Search"
          className="md:hidden pointer-events-auto p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-lg"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Desktop: floating glass pill */}
        <nav aria-label="Main" className="hidden md:flex items-center gap-2 pointer-events-auto">
          {isSearchOpen ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <SearchBar autoFocus onDone={() => setIsSearchOpen(false)} className="md:w-[420px]" />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="p-2.5 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-xl border border-white/10 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-zinc-900/70 hover:bg-zinc-900/85 backdrop-blur-2xl p-1 rounded-full border border-white/10 shadow-2xl shadow-black/80 transition-colors">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-300',
                      isActive ? 'bg-white text-black shadow-lg shadow-white/20 font-bold' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {Icon && (
                      <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-black fill-black' : 'text-zinc-400')} aria-hidden="true" />
                    )}
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span
                        className={cn(
                          'ml-0.5 px-1.5 text-[11px] font-extrabold rounded-full',
                          isActive ? 'bg-black text-white' : 'bg-accent text-white'
                        )}
                      >
                        {link.badge}
                        <span className="sr-only"> saved</span>
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="h-4 w-px bg-zinc-700/60 mx-1" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search (press /)"
                title="Search (/)"
                className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </nav>
      </div>

      <Modal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        title="Search"
        variant="sheet"
        className="pt-[max(1rem,env(safe-area-inset-top))]"
      >
        <SearchBar autoFocus onDone={() => setIsMobileSearchOpen(false)} className="max-w-none md:max-w-none" />
      </Modal>
    </header>
  );
}
