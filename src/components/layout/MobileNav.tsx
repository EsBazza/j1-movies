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
    { label: 'TV Series', href: '/tv', icon: Tv },
    { label: 'Search', href: '/search', icon: Search },
    {
      label: 'Watchlist',
      href: '/watchlist',
      icon: Bookmark,
      badge: hasHydrated && watchlist.length > 0 ? watchlist.length : undefined,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-2 safe-area-bottom">
      <nav className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                isActive ? 'text-red-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
