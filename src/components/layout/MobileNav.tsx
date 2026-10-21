'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Clapperboard, Search, Bookmark, Film, Tv, Sparkles, Heart, Shuffle, type LucideIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { openSurpriseMe } from '@/components/common/SurpriseMe';
import { useUserStoreSelector } from '@/lib/store';
import { cn } from '@/lib/utils';

const BROWSE: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Series', href: '/tv', icon: Tv },
  { label: 'Anime', href: '/anime', icon: Sparkles },
  { label: 'K-Drama', href: '/kdrama', icon: Heart },
];

const itemClass = (active: boolean) =>
  cn(
    'flex flex-1 flex-col items-center justify-center gap-1 min-h-14 text-[11px] font-medium transition-colors',
    active ? 'text-white' : 'text-zinc-400 active:text-white'
  );

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  pathname,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  pathname: string | null;
}) {
  const active = href === '/' ? pathname === '/' : Boolean(pathname?.startsWith(href));
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
      <span className="relative">
        <Icon className={cn('w-[22px] h-[22px]', active && 'text-accent')} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
        {badge ? (
          <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-accent text-on-accent text-[10px] font-bold flex items-center justify-center">
            {badge}
            <span className="sr-only"> saved</span>
          </span>
        ) : null}
      </span>
      {label}
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const watchlistCount = useUserStoreSelector((s) => s.watchlist.length);

  if (pathname?.startsWith('/watch/')) {
    return null;
  }

  const isBrowseActive = BROWSE.some((b) => pathname?.startsWith(b.href)) || pathname?.startsWith('/genre');
  const isReels = pathname === '/reels';

  return (
    <>
      <nav
        aria-label="Main"
        className={cn(
          'lg:hidden fixed bottom-0 inset-x-0 z-[var(--z-nav)] flex items-stretch px-2 pb-[env(safe-area-inset-bottom)]',
          isReels ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-bg/95 backdrop-blur-md'
        )}
      >
        <NavItem href="/" label="Home" icon={Home} pathname={pathname} />
        <button
          type="button"
          onClick={() => setIsBrowseOpen(true)}
          aria-haspopup="dialog"
          className={itemClass(Boolean(isBrowseActive))}
        >
          <LayoutGrid className={cn('w-[22px] h-[22px]', isBrowseActive && 'text-accent')} strokeWidth={isBrowseActive ? 2.4 : 1.8} aria-hidden="true" />
          Browse
        </button>
        <NavItem href="/reels" label="Reels" icon={Clapperboard} pathname={pathname} />
        <NavItem href="/search" label="Search" icon={Search} pathname={pathname} />
        <NavItem href="/watchlist" label="My List" icon={Bookmark} badge={watchlistCount || undefined} pathname={pathname} />
      </nav>

      <Modal isOpen={isBrowseOpen} onClose={() => setIsBrowseOpen(false)} title="Browse" variant="bottom">
        <div className="grid grid-cols-2 gap-2">
          {BROWSE.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsBrowseOpen(false)}
              className="flex items-center gap-3 h-14 px-4 rounded-panel bg-white/6 active:bg-white/12 text-sm font-semibold text-white"
            >
              <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsBrowseOpen(false);
              openSurpriseMe();
            }}
            className="col-span-2 flex items-center justify-center gap-2 h-14 rounded-panel bg-accent text-on-accent text-sm font-semibold"
          >
            <Shuffle className="w-5 h-5" aria-hidden="true" />
            Surprise me
          </button>
        </div>
      </Modal>
    </>
  );
}
