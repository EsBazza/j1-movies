'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Bookmark, Search } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { watchlist, hasHydrated } = useUserStore();

  const items = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'TV', href: '/tv', icon: Tv },
    { label: 'Search', href: '/search', icon: Search },
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
    <div className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none px-3 safe-area-bottom">
      <nav className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-zinc-950/85 hover:bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.95)] max-w-fit mx-auto transition-all">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 active:scale-95 cursor-pointer',
                isActive
                  ? 'bg-white text-black shadow-lg font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-black fill-black' : 'text-zinc-400'
                  )}
                />
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-2 px-1 min-w-[12px] h-[12px] text-[9px] font-extrabold rounded-full flex items-center justify-center',
                      isActive ? 'bg-black text-white' : 'bg-red-600 text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[11px]', !isActive && 'hidden sm:inline-block')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
