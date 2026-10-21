'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Bookmark, Sparkles, Heart } from 'lucide-react';
import { useUserStoreSelector } from '@/lib/store';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const watchlistCount = useUserStoreSelector((s) => s.watchlist.length);

  const items = [
    { label: 'Home', href: '/', icon: Home },
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
    <div className="md:hidden fixed bottom-0 inset-x-0 z-[var(--z-nav)] flex justify-center pointer-events-none px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Main"
        className="pointer-events-auto flex items-center gap-0.5 p-1.5 rounded-full bg-zinc-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.95)] max-w-full"
      >
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.badge ? `${item.label}, ${item.badge} saved` : item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-1.5 min-h-11 px-3 rounded-full text-xs font-semibold transition-colors duration-300 active:scale-95',
                isActive ? 'bg-white text-black shadow-lg font-bold' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              )}
            >
              <span className="relative flex items-center justify-center" aria-hidden="true">
                <Icon className={cn('w-4 h-4', isActive ? 'text-black fill-black' : 'text-zinc-400')} />
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -right-2.5 px-1 min-w-[14px] h-[14px] text-[9px] font-extrabold rounded-full flex items-center justify-center',
                      isActive ? 'bg-black text-white' : 'bg-accent text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span className={cn('text-[11px]', !isActive && 'hidden min-[420px]:inline-block')} aria-hidden="true">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
