'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Film, Tv, Star, Loader2, User, History, TrendingUp } from 'lucide-react';
import { searchMulti, getTrending, getPosterUrl, getImageUrl, normalizeMediaItem } from '@/lib/tmdb';
import { formatYear, cn } from '@/lib/utils';

interface Suggestion {
  key: string;
  href: string;
  title: string;
  kind: 'movie' | 'tv' | 'person';
  image: string | null;
  year?: string;
  rating?: number;
}

const RECENT_KEY = 'j1-recent-searches';
const MAX_RECENT = 5;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q) => typeof q === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const next = [query, ...readRecent().filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — recent searches are a convenience only
  }
}

interface SearchBarProps {
  autoFocus?: boolean;
  /** Called after navigating or pressing Escape on an empty box (e.g. to close a search sheet) */
  onDone?: () => void;
  className?: string;
}

export function SearchBar({ autoFocus = false, onDone, className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(autoFocus);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [trending, setTrending] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>(() => (autoFocus ? readRecent() : []));
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listboxId = useId();

  const trimmed = query.trim();

  // Debounced search; responses for an outdated query are ignored
  useEffect(() => {
    if (!trimmed) return;
    let ignore = false;
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchMulti(trimmed);
        if (ignore) return;
        const suggestions: Suggestion[] = (res.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv' || (r.media_type as string | undefined) === 'person')
          .slice(0, 7)
          .map((r) => {
            if ((r.media_type as string | undefined) === 'person') {
              const person = r as unknown as { id: number; name: string; profile_path: string | null };
              return {
                key: `person-${person.id}`,
                href: `/person/${person.id}`,
                title: person.name,
                kind: 'person' as const,
                image: person.profile_path ? getImageUrl(person.profile_path, 'w185') : null,
              };
            }
            const m = normalizeMediaItem(r);
            return {
              key: `${m.type}-${m.id}`,
              href: `/details/${m.type}/${m.id}`,
              title: m.title,
              kind: m.type,
              image: m.posterPath ? getPosterUrl(m.posterPath, 'w185') : null,
              year: formatYear(m.releaseDate),
              rating: m.rating,
            };
          });
        setResults(suggestions);
        setActiveIndex(-1);
      } catch (err) {
        if (!ignore) console.error('Search error:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  // Trending suggestions for the empty state (loaded once, on first open)
  const loadTrending = useCallback(() => {
    if (trending.length > 0) return;
    getTrending('all', 'day')
      .then((res) =>
        setTrending(
          (res.results || [])
            .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 5)
            .map((r) => {
              const m = normalizeMediaItem(r);
              return {
                key: `${m.type}-${m.id}`,
                href: `/details/${m.type}/${m.id}`,
                title: m.title,
                kind: m.type,
                image: m.posterPath ? getPosterUrl(m.posterPath, 'w185') : null,
                year: formatYear(m.releaseDate),
                rating: m.rating,
              };
            })
        )
      )
      .catch(() => {});
  }, [trending.length]);

  const open = () => {
    setIsOpen(true);
    setRecent(readRecent());
    loadTrending();
  };

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
    loadTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // Close the dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = trimmed ? results : trending;
  const showSpinner = isLoading && trimmed.length > 0;

  const navigate = (href: string) => {
    if (trimmed) saveRecent(trimmed);
    setIsOpen(false);
    router.push(href);
    onDone?.();
  };

  const submitSearch = (q: string) => {
    const value = q.trim();
    if (!value) return;
    saveRecent(value);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
    onDone?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) open();
      setActiveIndex((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) navigate(options[activeIndex].href);
      else submitSearch(query);
    } else if (e.key === 'Escape') {
      if (isOpen && (query || options.length)) {
        e.stopPropagation();
        setIsOpen(false);
        setActiveIndex(-1);
      } else {
        onDone?.();
      }
    }
  };

  const showDropdown = isOpen && (trimmed.length > 0 || recent.length > 0 || trending.length > 0);
  const activeId = activeIndex >= 0 && options[activeIndex] ? `${listboxId}-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-xs md:max-w-md', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(query);
        }}
        className="relative flex items-center"
      >
        <label htmlFor={`${listboxId}-input`} className="sr-only">
          Search movies, TV shows and people
        </label>
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={open}
          onKeyDown={handleKeyDown}
          placeholder="Search movies, shows, people…"
          className="w-full bg-zinc-900/90 hover:bg-zinc-800/90 focus:bg-zinc-900 text-sm text-zinc-100 placeholder-zinc-400 pl-10 pr-9 py-2.5 rounded-full border border-zinc-700/60 focus:border-red-500/80 transition-colors shadow-inner [&::-webkit-search-cancel-button]:hidden"
        />
        <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
        {showSpinner ? (
          <Loader2 className="absolute right-3 w-4 h-4 text-zinc-400 animate-spin" aria-hidden="true" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[var(--z-overlay)]">
          {!trimmed && recent.length > 0 && (
            <div className="px-3 pt-3 pb-1">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Recent</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => submitSearch(q)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-zinc-200 transition-colors"
                  >
                    <History className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!trimmed && trending.length > 0 && (
            <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" /> Trending today
            </p>
          )}

          {showSpinner && results.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-400" role="status">
              Searching…
            </div>
          ) : options.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label="Search suggestions" className="py-2">
              {options.map((item, idx) => (
                <li
                  key={item.key}
                  id={`${listboxId}-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors',
                    idx === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  )}
                >
                  <div
                    className={cn(
                      'relative w-10 h-14 overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center',
                      item.kind === 'person' ? 'rounded-full w-10 h-10' : 'rounded'
                    )}
                  >
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium text-sm text-zinc-100 truncate">{item.title}</span>
                    <span className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        {item.kind === 'movie' ? (
                          <Film className="w-3 h-3 text-red-500" aria-hidden="true" />
                        ) : item.kind === 'tv' ? (
                          <Tv className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                        ) : (
                          <User className="w-3 h-3 text-violet-400" aria-hidden="true" />
                        )}
                        {item.kind === 'movie' ? 'Movie' : item.kind === 'tv' ? 'Series' : 'Person'}
                      </span>
                      {item.year && <span>• {item.year}</span>}
                      {item.rating ? (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          • <Star className="w-3 h-3 fill-amber-400" aria-hidden="true" /> {item.rating}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : trimmed ? (
            <div className="p-4 text-center text-sm text-zinc-400" role="status">
              No titles found for &quot;{trimmed}&quot;
            </div>
          ) : null}

          {trimmed && results.length > 0 && (
            <div className="p-2 bg-zinc-900/40 text-center border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => submitSearch(query)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline"
              >
                View all results for &quot;{trimmed}&quot; →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
