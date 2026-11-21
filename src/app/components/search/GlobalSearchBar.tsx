import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import { globalSearch, GlobalSearchResult } from "../../../services/searchService";

const TYPE_ICON: Record<GlobalSearchResult['type'], string> = {
  RESIDENT: '👤',
  MAINTENANCE: '🔧',
  EVENT: '📅',
  NOTICE: '📢',
  VISITOR: '🏠',
};

const TYPE_LABEL: Record<GlobalSearchResult['type'], string> = {
  RESIDENT: 'Resident',
  MAINTENANCE: 'Maintenance',
  EVENT: 'Event',
  NOTICE: 'Notice',
  VISITOR: 'Visitor',
};

function groupByType(results: GlobalSearchResult[]): Record<string, GlobalSearchResult[]> {
  return results.reduce<Record<string, GlobalSearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const flatResults = results;

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(q, 20);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Listen for Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for mana:open-search custom event (triggered by topbar button)
  useEffect(() => {
    function handleOpen() {
      inputRef.current?.focus();
      setOpen(true);
    }
    window.addEventListener('mana:open-search', handleOpen);
    return () => window.removeEventListener('mana:open-search', handleOpen);
  }, []);

  function navigateTo(url: string) {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(url);
  }

  function handleKeyboardNav(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && flatResults[activeIdx]) {
        navigateTo(flatResults[activeIdx].url);
      } else if (query.trim()) {
        navigateTo(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length > 0;
  const grouped = groupByType(results);
  const noResults = !loading && query.trim().length > 0 && results.length === 0;

  // Build ordered flat list for keyboard nav index
  const orderedResults: GlobalSearchResult[] = Object.values(grouped).flat();

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search features, events, residents..."
          className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#F9FAFC] border border-[#EBEFF2] hover:border-[#A7F3D0] focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]/20 outline-none text-xs text-[#44475B] placeholder-[#9CA3AF] transition-all"
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); setOpen(true); }}
          onKeyDown={handleKeyboardNav}
          aria-label="Global search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-2.5 p-0.5 text-[#9CA3AF] hover:text-[#44475B] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#EBEFF2] rounded-2xl shadow-xl shadow-slate-900/10 z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-xs text-[#7C7E8C]">Searching…</div>
          )}
          {!loading && noResults && (
            <div className="px-4 py-4 text-xs text-[#7C7E8C] text-center">
              No results for <span className="font-semibold text-[#44475B]">"{query}"</span>
            </div>
          )}
          {!loading && Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                {TYPE_ICON[type as GlobalSearchResult['type']]} {TYPE_LABEL[type as GlobalSearchResult['type']]}
              </div>
              {items.map((item) => {
                const idx = orderedResults.indexOf(item);
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F9FAFC] text-left transition-colors cursor-pointer ${idx === activeIdx ? 'bg-[#E6FAF5]' : ''}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => navigateTo(item.url)}
                  >
                    <span className="text-base w-6 text-center shrink-0">{TYPE_ICON[item.type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#44475B] truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-[#7C7E8C] truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#F1F4F7] text-[#7C7E8C] shrink-0">
                      {TYPE_LABEL[item.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {!loading && results.length > 0 && (
            <button
              type="button"
              className="w-full px-3 py-2.5 text-xs text-[#00D09C] font-semibold hover:bg-[#E6FAF5] transition-colors border-t border-[#EBEFF2] cursor-pointer text-left"
              onClick={() => navigateTo(`/search?q=${encodeURIComponent(query.trim())}`)}
            >
              See all results for "{query}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
