export type MediaType = 'movie' | 'tv';

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBMediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: MediaType;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language?: string;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  genre_ids?: number[];
  genres?: TMDBGenre[];
  adult?: boolean;
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  original_name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }>;
}

export interface TMDBPersonDetails {
  id: number;
  name: string;
  also_known_as?: string[];
  biography: string;
  birthday: string | null;
  deathday: string | null;
  gender: number;
  known_for_department: string;
  place_of_birth: string | null;
  popularity: number;
  profile_path: string | null;
  combined_credits?: {
    cast: TMDBMediaItem[];
    crew: Array<TMDBMediaItem & { job: string; department: string }>;
  };
  images?: {
    profiles: Array<{ file_path: string }>;
  };
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TMDBVideoResponse {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime?: number;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
  episodes?: TMDBEpisode[];
}

export interface TMDBLogo {
  aspect_ratio: number;
  height: number;
  width: number;
  file_path: string;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBImagesResponse {
  id?: number;
  backdrops?: Array<{
    aspect_ratio: number;
    height: number;
    width: number;
    file_path: string;
    vote_average: number;
    vote_count: number;
  }>;
  posters?: Array<{
    aspect_ratio: number;
    height: number;
    width: number;
    file_path: string;
    vote_average: number;
    vote_count: number;
  }>;
  logos?: TMDBLogo[];
}

export interface TMDBMovieDetails extends TMDBMediaItem {
  runtime: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  genres: TMDBGenre[];
  videos?: TMDBVideoResponse;
  credits?: TMDBCredits;
  images?: TMDBImagesResponse;
  similar?: TMDBPaginatedResponse<TMDBMediaItem>;
  recommendations?: TMDBPaginatedResponse<TMDBMediaItem>;
}

export interface TMDBTVDetails extends TMDBMediaItem {
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
  status: string;
  tagline: string;
  genres: TMDBGenre[];
  videos?: TMDBVideoResponse;
  credits?: TMDBCredits;
  images?: TMDBImagesResponse;
  similar?: TMDBPaginatedResponse<TMDBMediaItem>;
  recommendations?: TMDBPaginatedResponse<TMDBMediaItem>;
}

export interface NormalizedMedia {
  id: number;
  type: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  releaseDate: string;
  genres?: TMDBGenre[];
}

export interface WatchHistoryItem {
  id: number;
  type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  lastWatchedAt: number;
}

export interface WatchlistItem {
  id: number;
  type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  addedAt: number;
}

export interface CustomCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  items: WatchlistItem[];
}
