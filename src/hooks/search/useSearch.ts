import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService, SearchResponse, SearchModule } from '../../services/search/searchService';

const RECENT_KEY = 'mana_recent_searches';
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}

function addRecentSearch(q: string) {
  try {
    const list = getRecentSearches().filter(s => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...list].slice(0, MAX_RECENT)));
  } catch {}
}

export function useSearch(initialModules?: SearchModule[]) {
  const [query, setQuery] = useState('');
  const [activeModules, setActiveModules] = useState<SearchModule[]>(initialModules ?? []);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  const executeSearch = useCallback(async (q: string, modules: SearchModule[], p: number) => {
    if (!q.trim()) { setResponse(null); return; }
    setLoading(true);
    try {
      const res = await searchService.search({
        q,
        modules: modules.length ? modules : undefined,
        page: p,
      });
      setResponse(prev =>
        p === 0 ? res : prev ? { ...res, results: [...prev.results, ...res.results] } : res
      );
      setError(null);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e
        ? String((e as { message?: unknown }).message)
        : 'Search failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const activeModulesKey = activeModules.join(',');

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResponse(null); return; }
    debounceRef.current = setTimeout(() => {
      setPage(0);
      executeSearch(query, activeModules, 0);
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeModulesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!response || response.results.length >= response.total) return;
    const next = page + 1;
    setPage(next);
    executeSearch(query, activeModules, next);
  }, [response, page, query, activeModules, executeSearch]);

  const toggleModule = useCallback((m: SearchModule) =>
    setActiveModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]),
  []);

  const clearRecentSearches = useCallback(() => {
    try { localStorage.removeItem(RECENT_KEY); } catch {}
    setRecentSearches([]);
  }, []);

  return {
    query, setQuery,
    activeModules, toggleModule,
    response, loading, error,
    loadMore,
    hasMore: response ? response.results.length < response.total : false,
    recentSearches, clearRecentSearches,
  };
}
