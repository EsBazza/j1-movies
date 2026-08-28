'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Film, Tv, Star, Loader2 } from 'lucide-react';
import { searchMulti, getPosterUrl, normalizeMediaItem } from '@/lib/tmdb';
import { NormalizedMedia } from '@/types/tmdb';
import { formatYear } from '@/lib/utils';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchMulti(query.trim());
        const filtered = (res.results || [])
          .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 6)
          .map((item) => normalizeMediaItem(item));
        setResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xs md:max-w-md">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search movies, TV shows..."
          className="w-full bg-zinc-900/90 hover:bg-zinc-800/90 focus:bg-zinc-900 text-sm text-zinc-100 placeholder-zinc-400 pl-10 pr-9 py-2 rounded-full border border-zinc-700/60 focus:border-red-500/80 focus:outline-none transition-all shadow-inner"
        />
        <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
        
        {isLoading ? (
          <Loader2 className="absolute right-3 w-4 h-4 text-zinc-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 p-0.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Instant Dropdown Preview */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-zinc-400">Searching TMDB...</div>
          ) : results.length > 0 ? (
            <div className="py-2 divide-y divide-zinc-800/50">
              {results.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`/details/${item.type}/${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900/80 transition-colors group"
                >
                  <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                    <Image
                      src={getPosterUrl(item.posterPath, 'w185')}
                      alt={item.title}
                      fill
                      sizes="40px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-zinc-100 truncate group-hover:text-red-400 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1 capitalize">
                        {item.type === 'movie' ? (
                          <Film className="w-3 h-3 text-red-500" />
                        ) : (
                          <Tv className="w-3 h-3 text-cyan-400" />
                        )}
                        {item.type}
                      </span>
                      {item.releaseDate && <span>• {formatYear(item.releaseDate)}</span>}
                      {item.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          • <Star className="w-3 h-3 fill-amber-400" /> {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <div className="p-2 bg-zinc-900/40 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                >
                  View all results for &quot;{query}&quot; →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-zinc-400">
              No titles found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
