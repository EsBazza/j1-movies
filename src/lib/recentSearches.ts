const RECENT_KEY = 'j1-recent-searches';
const MAX_RECENT = 6;

/** Recent search queries, newest first (browser-only, best effort). */
export function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q) => typeof q === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  try {
    const next = [q, ...readRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — recent searches are a convenience only
  }
}

export function clearRecentSearches() {
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}
