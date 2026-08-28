'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  Calendar,
  MapPin,
  Film,
  Tv,
  Clapperboard,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getPersonDetails, getImageUrl, normalizeMediaItem } from '@/lib/tmdb';
import { TMDBPersonDetails, NormalizedMedia, MediaType } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Badge } from '@/components/ui/Badge';
import { formatYear, cn } from '@/lib/utils';

function PersonContent() {
  const params = useParams();
  const router = useRouter();
  const personId = (params?.id as string) || '';

  const [person, setPerson] = useState<TMDBPersonDetails | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'crew'>('all');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;

    async function loadPerson() {
      setIsLoading(true);
      try {
        const data = await getPersonDetails(personId);
        setPerson(data);
      } catch (err) {
        console.error('Failed to load person details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPerson();
  }, [personId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          <div className="w-44 h-60 rounded-2xl bg-zinc-800 animate-pulse flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="w-48 h-8 bg-zinc-800 rounded animate-pulse" />
            <div className="w-full h-24 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Person Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Could not retrieve filmography details for this person.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Aggregate and filter filmography items
  const castItems = person.combined_credits?.cast || [];
  const crewItems = person.combined_credits?.crew || [];

  // Deduplicate items
  const seenIds = new Set<string>();
  let itemsToDisplay: NormalizedMedia[] = [];

  const rawList = filterType === 'crew' ? crewItems : castItems;

  rawList.forEach((raw) => {
    const type: MediaType = raw.media_type || (raw.first_air_date ? 'tv' : 'movie');
    const key = `${type}-${raw.id}`;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      if (
        filterType === 'all' ||
        filterType === 'crew' ||
        (filterType === 'movie' && type === 'movie') ||
        (filterType === 'tv' && type === 'tv')
      ) {
        itemsToDisplay.push(normalizeMediaItem(raw, type));
      }
    }
  });

  // Sort filmography
  if (sortBy === 'vote_average.desc') {
    itemsToDisplay.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'release_date.desc') {
    itemsToDisplay.sort((a, b) => {
      const dateA = new Date(a.releaseDate || '1970-01-01').getTime();
      const dateB = new Date(b.releaseDate || '1970-01-01').getTime();
      return dateB - dateA;
    });
  } else {
    // Default popularity
    itemsToDisplay.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Person Bio Header */}
      <div className="flex flex-col md:flex-row items-start gap-8 pb-10 border-b border-zinc-800">
        {/* Profile Image */}
        <div className="relative w-44 sm:w-52 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl flex-shrink-0">
          {person.profile_path ? (
            <Image
              src={getImageUrl(person.profile_path, 'w500')}
              alt={person.name}
              fill
              priority
              sizes="220px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
              <User className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Bio Details */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="accent" className="font-bold">
              {person.known_for_department || 'Artist'}
            </Badge>
            {person.birthday && (
              <Badge variant="outline" className="bg-black/40">
                <Calendar className="w-3 h-3 mr-1" />
                Born {formatYear(person.birthday)}
              </Badge>
            )}
            {person.place_of_birth && (
              <Badge variant="outline" className="bg-black/40">
                <MapPin className="w-3 h-3 mr-1" />
                {person.place_of_birth}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            {person.name}
          </h1>

          {/* Biography */}
          {person.biography ? (
            <div className="flex flex-col gap-2">
              <p
                className={cn(
                  'text-sm text-zinc-300 leading-relaxed max-w-4xl transition-all',
                  !isBioExpanded && 'line-clamp-4'
                )}
              >
                {person.biography}
              </p>
              {person.biography.length > 300 && (
                <button
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 self-start cursor-pointer transition-colors"
                >
                  <span>{isBioExpanded ? 'Read Less' : 'Read Full Biography'}</span>
                  {isBioExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">No biography available for this artist.</p>
          )}
        </div>
      </div>

      {/* Filmography Section Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-red-500" />
            <span>Filmography & Appearances</span>
            <span className="text-sm text-zinc-500 font-medium">({itemsToDisplay.length} titles)</span>
          </h2>
        </div>

        {/* Filter Tabs & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                filterType === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              All Works
            </button>
            <button
              onClick={() => setFilterType('movie')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                filterType === 'movie'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Film className="w-3 h-3" />
              <span>Movies</span>
            </button>
            <button
              onClick={() => setFilterType('tv')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                filterType === 'tv'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Tv className="w-3 h-3" />
              <span>TV Series</span>
            </button>
            {crewItems.length > 0 && (
              <button
                onClick={() => setFilterType('crew')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  filterType === 'crew'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Directing / Crew
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-red-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white text-xs font-semibold rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:border-red-500 cursor-pointer shadow-lg transition-colors"
            >
              <option value="popularity.desc">🔥 Most Popular</option>
              <option value="vote_average.desc">⭐ Highest Rated</option>
              <option value="release_date.desc">📅 Release Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filmography Media Grid */}
      {itemsToDisplay.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {itemsToDisplay.map((item, index) => (
            <MediaCard
              key={`${item.type}-${item.id}-${index}`}
              item={item}
              priority={index < 5}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-zinc-500 text-sm">
          No titles found for this filter.
        </div>
      )}
    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-zinc-400">Loading Artist Profile...</div>}>
      <PersonContent />
    </Suspense>
  );
}
