export interface SubGenreDefinition {
  id: string;
  name: string;
  genreId?: number;
  keywordId?: number;
  description?: string;
}

export interface HubExploreConfig {
  hubTitle: string;
  mediaType: 'movie' | 'tv';
  defaultOriginCountry?: string;
  defaultOriginalLanguage?: string;
  baseGenreId?: number; // e.g. 16 for Animation in Anime
  subGenres: SubGenreDefinition[];
}

export const HUB_CONFIGS: Record<'movies' | 'tv' | 'anime' | 'kdrama', HubExploreConfig> = {
  movies: {
    hubTitle: 'Explore Feature Films',
    mediaType: 'movie',
    subGenres: [
      { id: 'all', name: 'All Cinema' },
      { id: 'action', name: 'Action & Adventure', genreId: 28 },
      { id: 'scifi', name: 'Sci-Fi & Future', genreId: 878 },
      { id: 'thriller', name: 'Thrillers & Crime', genreId: 53 },
      { id: 'comedy', name: 'Comedy & Satire', genreId: 35 },
      { id: 'horror', name: 'Horror & Supernatural', genreId: 27 },
      { id: 'drama', name: 'Deep Drama', genreId: 18 },
      { id: 'fantasy', name: 'Epic Fantasy', genreId: 14 },
      { id: 'animation', name: 'Animated Cinema', genreId: 16 },
      { id: 'mystery', name: 'Mystery & Noir', genreId: 9648 },
      { id: 'romance', name: 'Romance', genreId: 10749 },
      { id: 'family', name: 'Family & Kids', genreId: 10751 },
      { id: 'time_travel', name: 'Time Travel', keywordId: 4379 },
      { id: 'superhero', name: 'Superheroes', keywordId: 9715 },
    ],
  },
  tv: {
    hubTitle: 'Explore TV Series',
    mediaType: 'tv',
    subGenres: [
      { id: 'all', name: 'All Shows' },
      { id: 'action_adv', name: 'Action & Adventure', genreId: 10759 },
      { id: 'drama', name: 'Gripping Drama', genreId: 18 },
      { id: 'scifi_fan', name: 'Sci-Fi & Fantasy', genreId: 10765 },
      { id: 'comedy', name: 'Comedy Hits', genreId: 35 },
      { id: 'crime', name: 'Crime & Investigation', genreId: 80 },
      { id: 'mystery', name: 'Mind-Bending Mystery', genreId: 9648 },
      { id: 'animation', name: 'Animated Shows', genreId: 16 },
      { id: 'family', name: 'Kids & Family', genreId: 10762 },
      { id: 'documentary', name: 'Documentary', genreId: 99 },
      { id: 'war', name: 'War & Politics', genreId: 10768 },
      { id: 'revenge', name: 'Revenge Thrillers', keywordId: 9748 },
    ],
  },
  anime: {
    hubTitle: 'Explore Anime Universes',
    mediaType: 'tv',
    defaultOriginCountry: 'JP',
    defaultOriginalLanguage: 'ja',
    baseGenreId: 16,
    subGenres: [
      { id: 'all', name: 'All Anime' },
      { id: 'isekai', name: 'Isekai & Reincarnation', keywordId: 210024 },
      { id: 'shonen', name: 'Shonen & Action', genreId: 10759 },
      { id: 'fantasy', name: 'Dark Fantasy & Magic', genreId: 10765 },
      { id: 'manga_adapt', name: 'Manga Adaptations', keywordId: 1930 },
      { id: 'high_school', name: 'High School & Slice of Life', keywordId: 6270 },
      { id: 'comedy', name: 'Comedy & Parody', genreId: 35 },
      { id: 'drama', name: 'Emotional Drama', genreId: 18 },
      { id: 'mystery', name: 'Psychological Mystery', genreId: 9648 },
      { id: 'time_travel', name: 'Time Travel & Multiverse', keywordId: 4379 },
    ],
  },
  kdrama: {
    hubTitle: 'Explore K-Dramas & Asian Cinema',
    mediaType: 'tv',
    defaultOriginCountry: 'KR',
    defaultOriginalLanguage: 'ko',
    subGenres: [
      { id: 'all', name: 'All K-Dramas' },
      { id: 'romance', name: 'Heartfelt Romance', genreId: 10749 },
      { id: 'enemies_lovers', name: 'Enemies to Lovers', keywordId: 280398 },
      { id: 'webtoon', name: 'Webtoon Adaptations', keywordId: 270030 },
      { id: 'chaebol', name: 'Chaebol & High Society', keywordId: 279932 },
      { id: 'thriller', name: 'Crime & Dark Mystery', genreId: 9648 },
      { id: 'revenge', name: 'Revenge & Retribution', keywordId: 9748 },
      { id: 'melodrama', name: 'Melodrama & Soap', genreId: 10766 },
      { id: 'action', name: 'Action & Martial Arts', genreId: 10759 },
      { id: 'fantasy', name: 'Fantasy & Supernatural', genreId: 10765 },
      { id: 'comedy', name: 'Romantic Comedy', genreId: 35 },
    ],
  },
};
