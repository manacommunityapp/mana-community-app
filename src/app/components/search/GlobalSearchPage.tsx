import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search, X } from "lucide-react";
import { globalSearch, type GlobalSearchResult } from "../../../services/searchService";

const TYPE_ICON: Record<GlobalSearchResult['type'], string> = {
  RESIDENT: '👤',
  MAINTENANCE: '🔧',
  EVENT: '📅',
  NOTICE: '📢',
  VISITOR: '🏠',
};

const TYPE_LABEL: Record<GlobalSearchResult['type'], string> = {
  RESIDENT: 'Residents',
  MAINTENANCE: 'Maintenance',
  EVENT: 'Events',
  NOTICE: 'Notices',
  VISITOR: 'Visitors',
};

const TYPE_ORDER: GlobalSearchResult['type'][] = ['RESIDENT', 'EVENT', 'NOTICE', 'MAINTENANCE', 'VISITOR'];

/**
 * Server-supplied result paths must be relative, same-origin and query-free.
 * Rejects "//evil.com" (protocol-relative), any scheme, and any "?"/"#" payload.
 * (`utils/sanitize.sanitizeHref` is deliberately NOT used here: it also permits
 * absolute http(s)/mailto/tel URLs and query strings, which is too wide for a
 * router navigation target.)
 */
const SAFE_RESULT_PATH = /^\/[A-Za-z0-9/_-]*$/;

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#EBEFF2] animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-[#F1F4F7] shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-[#F1F4F7] rounded w-2/3" />
        <div className="h-2.5 bg-[#F1F4F7] rounded w-1/2" />
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      {query ? (
        <>
          <p className="text-sm font-semibold text-[#44475B]">No results for "{query}"</p>
          <p className="text-xs text-[#7C7E8C] mt-1">Try different keywords or a shorter phrase</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-[#44475B]">Search across the community</p>
          <p className="text-xs text-[#7C7E8C] mt-1">Find residents, events, notices, maintenance requests and visitors</p>
        </>
      )}
    </div>
  );
}

export function GlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    // Cancel whatever is in flight: its response is stale by definition.
    abortRef.current?.abort();
    if (!q.trim()) {
      abortRef.current = null;
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const data = await globalSearch(q, 50, controller.signal);
      if (controller.signal.aborted) return;
      setResults(data);
    } catch (err) {
      // A superseded request must not clear the newer query's results or spinner.
      if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
      setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // The debounced effect below already runs for the initial ?q= value, so there is
  // no separate mount-time fetch to race against it.

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setSearchParams(query ? { q: query } : {}, { replace: true });
      return;
    }
    setLoading(true);
    setSearchParams({ q: query }, { replace: true });
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [query, runSearch, setSearchParams]);

  /** Navigate to a path that came from the server — validated before use. */
  function handleResultClick(url: string) {
    if (typeof url !== 'string' || !SAFE_RESULT_PATH.test(url)) return;
    navigate(url);
  }

  // Group results by type in defined order
  const grouped: Partial<Record<GlobalSearchResult['type'], GlobalSearchResult[]>> = {};
  for (const type of TYPE_ORDER) {
    const items = results.filter((r) => r.type === type);
    if (items.length > 0) grouped[type] = items;
  }

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#44475B] leading-tight mb-1">
          Search
        </h1>
        <p className="text-xs text-[#7C7E8C]">Find anything across your community</p>
      </div>

      {/* Large Search Input */}
      <div className="relative mb-6 sm:mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF] pointer-events-none" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={query}
          placeholder="Search residents, events, notices, maintenance..."
          className="w-full pl-12 pr-10 py-3 sm:py-3.5 rounded-2xl border border-[#EBEFF2] hover:border-[#A7F3D0] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/15 outline-none text-sm text-[#44475B] placeholder-[#9CA3AF] bg-white shadow-sm transition-all"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-[#44475B] transition-colors cursor-pointer rounded-full hover:bg-[#F1F4F7]"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {hasQuery && !loading && hasResults && (
        <p className="text-xs text-[#7C7E8C] mb-4">
          {results.length} result{results.length !== 1 ? 's' : ''} for <span className="font-semibold text-[#44475B]">"{query}"</span>
        </p>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && (!hasQuery || (!hasResults && hasQuery)) && (
        <EmptyState query={query} />
      )}

      {/* Grouped Results */}
      {!loading && hasResults && (
        <div className="space-y-6">
          {(Object.keys(grouped) as GlobalSearchResult['type'][]).map((type) => (
            <section key={type}>
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7C7E8C] mb-2.5 px-1">
                <span>{TYPE_ICON[type]}</span>
                <span>{TYPE_LABEL[type]}</span>
                <span className="ml-auto font-medium normal-case tracking-normal text-[11px] text-[#9CA3AF]">
                  {grouped[type]!.length}
                </span>
              </h2>
              <div className="space-y-1.5">
                {grouped[type]!.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleResultClick(item.url)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-[#EBEFF2] hover:border-[#A7F3D0] hover:shadow-sm text-left transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[#F1F4F7] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                      {TYPE_ICON[item.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#44475B] truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-[#7C7E8C] truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[#00D09C] group-hover:translate-x-0.5 transition-transform shrink-0">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
