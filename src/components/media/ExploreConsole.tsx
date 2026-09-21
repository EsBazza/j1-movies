'use client';

import React from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Calendar,
  Star,
  Globe,
  Tag,
  Check,
} from 'lucide-react';
import { SubGenreDefinition } from '@/lib/hubExploreConfigs';
import { cn } from '@/lib/utils';

export interface FilterState {
  year: string;
  minRating: number;
  language: string;
  sortBy: string;
  format?: 'all' | 'movie' | 'tv';
}

interface ExploreConsoleProps {
  title: string;
  icon?: React.ElementType;
  subGenres: SubGenreDefinition[];
  activeSubGenreId: string;
  onSelectSubGenre: (id: string) => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  isFiltering: boolean;
  totalResultsCount?: number;
  // Format switch support (e.g. for Movies/TV/Anime tabs where both movies and tv series exist)
  allowFormatSwitch?: boolean;
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
  { label: '2000s Classic', value: '2000' },
  { label: '90s Golden Era', value: '1995' },
];

const RATING_OPTIONS = [
  { label: 'Any Score', value: 0 },
  { label: '6.0+ Good', value: 6 },
  { label: '7.0+ Great', value: 7 },
  { label: '8.0+ Masterpiece', value: 8 },
  { label: '8.5+ Legendary', value: 8.5 },
];

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popularity.desc' },
  { label: 'Highest Rated', value: 'vote_average.desc' },
  { label: 'Newest Releases', value: 'primary_release_date.desc' },
  { label: 'Most Voted', value: 'vote_count.desc' },
  { label: 'Title (A - Z)', value: 'original_title.asc' },
];

export function ExploreConsole({
  title,
  icon: Icon = Sparkles,
  subGenres,
  activeSubGenreId,
  onSelectSubGenre,
  filters,
  onFilterChange,
  onResetFilters,
  isFiltering,
  totalResultsCount,
  allowFormatSwitch = false,
}: ExploreConsoleProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const activeSubGenre = subGenres.find((s) => s.id === activeSubGenreId);
  const hasDrawerFilters = Boolean(filters.year || filters.minRating > 0 || (allowFormatSwitch && filters.format && filters.format !== 'all'));

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-[#12141a]/85 border border-white/[0.08] backdrop-blur-2xl p-5 sm:p-6 shadow-2xl transition-all duration-300">
      {/* Top Header Row: Console Title + Active Counters + Quick Sort & Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
              {isFiltering && (
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  Active Filter
                </span>
              )}
            </div>
            {isFiltering && totalResultsCount !== undefined && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Displaying matching titles based on selected parameters
              </p>
            )}
          </div>
        </div>

        {/* Quick Action Controls: Reset, Sort Dropdown, Advanced Drawer Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {isFiltering && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-red-600/20 text-xs font-semibold text-zinc-300 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Quick Sort Dropdown */}
          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-red-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
              className="appearance-none bg-black/60 border border-white/15 hover:border-white/30 text-white text-xs font-semibold rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-red-500 cursor-pointer shadow-lg transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-950 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filter Drawer Trigger */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-md',
              isDrawerOpen || hasDrawerFilters
                ? 'bg-red-600 text-white border-red-500 shadow-red-950/30'
                : 'bg-black/60 hover:bg-white/10 border-white/15 text-zinc-300 hover:text-white'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasDrawerFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {isDrawerOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Release Era */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Release Year</span>
              </label>
              <select
                value={filters.year}
                onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
                className="bg-zinc-950 border border-white/10 hover:border-white/20 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {YEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-950 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Minimum Rating</span>
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => onFilterChange({ ...filters, minRating: Number(e.target.value) })}
                className="bg-zinc-950 border border-white/10 hover:border-white/20 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-950 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Format Switcher (e.g. Movies vs Series within Anime or K-Drama) */}
            {allowFormatSwitch && (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Format Type</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => onFilterChange({ ...filters, format: 'all' })}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      !filters.format || filters.format === 'all'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => onFilterChange({ ...filters, format: 'tv' })}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      filters.format === 'tv'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    Series
                  </button>
                  <button
                    type="button"
                    onClick={() => onFilterChange({ ...filters, format: 'movie' })}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      filters.format === 'movie'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    Movies
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Sub-Genre Pills Row with smooth horizontal scrolling */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
        {subGenres.map((sub) => {
          const isActive = activeSubGenreId === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubGenre(sub.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-md',
                isActive
                  ? 'bg-red-600 text-white shadow-red-600/30 scale-105 border border-red-500'
                  : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
              )}
            >
              {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
