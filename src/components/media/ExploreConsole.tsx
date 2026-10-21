'use client';

import React from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { SubGenreDefinition } from '@/lib/hubExploreConfigs';
import { Chip } from '@/components/ui/Chip';
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
  /** @deprecated decorative icons were removed in the redesign */
  icon?: React.ElementType;
  subGenres: SubGenreDefinition[];
  activeSubGenreId: string;
  onSelectSubGenre: (id: string) => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  isFiltering: boolean;
  totalResultsCount?: number;
  /** Movies vs series switch (Anime, K-Drama) */
  allowFormatSwitch?: boolean;
}

const YEAR_OPTIONS = [
  { label: 'Any year', value: '' },
  { label: '2026', value: '2026' },
  { label: '2025', value: '2025' },
  { label: '2024', value: '2024' },
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: '2010s', value: '2010s' },
  { label: '2000s', value: '2000s' },
  { label: '1990s', value: '1990s' },
];

const RATING_OPTIONS = [
  { label: 'Any rating', value: 0 },
  { label: '6+', value: 6 },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
];

const SORT_OPTIONS = [
  { label: 'Popular', value: 'popularity.desc' },
  { label: 'Top rated', value: 'vote_average.desc' },
  { label: 'Newest', value: 'primary_release_date.desc' },
  { label: 'Most voted', value: 'vote_count.desc' },
  { label: 'A–Z', value: 'original_title.asc' },
];

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { label: string; value: string | number }[];
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 pl-4 pr-9 rounded-full bg-white/8 hover:bg-white/14 text-xs font-semibold text-white cursor-pointer transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-2 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 w-4 h-4 text-muted pointer-events-none" aria-hidden="true" />
    </label>
  );
}

/** Borderless filter bar: genre chips, sort, and an expandable year/rating/format row. */
export function ExploreConsole({
  title,
  subGenres,
  activeSubGenreId,
  onSelectSubGenre,
  filters,
  onFilterChange,
  onResetFilters,
  isFiltering,
  allowFormatSwitch = false,
}: ExploreConsoleProps) {
  const [showMore, setShowMore] = React.useState(false);
  const extraCount =
    (filters.year ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (allowFormatSwitch && filters.format && filters.format !== 'all' ? 1 : 0);

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {isFiltering && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-muted hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
          <SelectPill
            label="Sort by"
            value={filters.sortBy}
            onChange={(v) => onFilterChange({ ...filters, sortBy: v })}
            options={SORT_OPTIONS}
          />
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition-colors',
              showMore || extraCount ? 'bg-white text-black' : 'bg-white/8 hover:bg-white/14 text-white'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Filters{extraCount ? ` · ${extraCount}` : ''}
          </button>
        </div>
      </div>

      {showMore && (
        <div className="flex flex-wrap items-center gap-2 animate-slide-up">
          <SelectPill
            label="Release year"
            value={filters.year}
            onChange={(v) => onFilterChange({ ...filters, year: v })}
            options={YEAR_OPTIONS}
          />
          <SelectPill
            label="Minimum rating"
            value={filters.minRating}
            onChange={(v) => onFilterChange({ ...filters, minRating: Number(v) })}
            options={RATING_OPTIONS}
          />
          {allowFormatSwitch && (
            <div className="flex items-center gap-1" role="group" aria-label="Format">
              {(['all', 'tv', 'movie'] as const).map((f) => (
                <Chip
                  key={f}
                  selected={(filters.format || 'all') === f}
                  onClick={() => onFilterChange({ ...filters, format: f })}
                >
                  {f === 'all' ? 'All' : f === 'tv' ? 'Series' : 'Movies'}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Genre">
        {subGenres.map((sub) => (
          <Chip key={sub.id} selected={activeSubGenreId === sub.id} onClick={() => onSelectSubGenre(sub.id)}>
            {sub.name}
          </Chip>
        ))}
      </div>
    </section>
  );
}
