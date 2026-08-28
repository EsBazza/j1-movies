'use client';

import React from 'react';
import { SlidersHorizontal, RotateCcw, X, Star, Calendar, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  year: string;
  minRating: number;
  language: string;
  sortBy: string;
}

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

const YEAR_OPTIONS = [
  { label: 'All Eras', value: '' },
  { label: '2026', value: '2026' },
  { label: '2025', value: '2025' },
  { label: '2024', value: '2024' },
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: '2020', value: '2020' },
  { label: '2015', value: '2015' },
  { label: '2010', value: '2010' },
  { label: '2000', value: '2000' },
  { label: '1995', value: '1995' },
];

const RATING_OPTIONS = [
  { label: 'Any Score', value: 0 },
  { label: '⭐ 5.0+', value: 5 },
  { label: '⭐ 6.0+', value: 6 },
  { label: '⭐ 7.0+ (Great)', value: 7 },
  { label: '⭐ 8.0+ (Masterpiece)', value: 8 },
];

const LANGUAGE_OPTIONS = [
  { label: 'All Languages', value: '' },
  { label: '🇺🇸 English', value: 'en' },
  { label: '🇯🇵 Japanese (Anime)', value: 'ja' },
  { label: '🇰🇷 Korean (K-Drama)', value: 'ko' },
  { label: '🇪🇸 Spanish', value: 'es' },
  { label: '🇫🇷 French', value: 'fr' },
  { label: '🇮🇳 Hindi', value: 'hi' },
];

export function AdvancedFilterDrawer({
  isOpen,
  onToggle,
  filters,
  onFilterChange,
  onReset,
}: AdvancedFilterDrawerProps) {
  const hasActiveFilters = Boolean(
    filters.year || filters.minRating > 0 || filters.language
  );

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Toggle Button & Active Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-md',
            isOpen || hasActiveFilters
              ? 'bg-red-600/15 text-red-400 border-red-500/50 shadow-red-950/20'
              : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Advanced Discovery</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {isOpen && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-2xl flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Year / Era */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Release Year</span>
              </label>
              <select
                value={filters.year}
                onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {YEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum TMDB Rating */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Minimum Rating</span>
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => onFilterChange({ ...filters, minRating: Number(e.target.value) })}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Original Language */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Language & Region</span>
              </label>
              <select
                value={filters.language}
                onChange={(e) => onFilterChange({ ...filters, language: e.target.value })}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
