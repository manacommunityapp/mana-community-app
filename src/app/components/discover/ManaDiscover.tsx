import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSearch } from '../../../hooks/search/useSearch';
import { SearchModule, SearchResultDto } from '../../../services/search/searchService';
import { SearchResultCard } from './SearchResultCard';
import { SearchFilters, MobileFiltersDrawer } from './SearchFilters';
import { MODULE_GROUPS, MODULE_ICON, MODULE_LABEL } from './moduleConfig';

interface ManaDiscoverProps {
  initialQuery?: string;
  initialModules?: SearchModule[];
}

const ROUTE_MAP: Record<string, (id: string) => string> = {
  PERSON: id => `/community/members/${id}`,
  EVENT: id => `/events/${id}`,
  POOJA: id => `/events/${id}`,
  SPORTS_EVENT: id => `/sports/${id}`,
  COACHING: id => `/sports/coaching/${id}`,
  FOOD_RESTAURANT: id => `/food/restaurants/${id}`,
  FOOD_MENU_ITEM: id => `/food/menu/${id}`,
  GROCERY_PRODUCT: id => `/food/grocery/${id}`,
  HOME_CHEF: id => `/food/chefs/${id}`,
  HOME_SERVICE: id => `/home-services/${id}`,
  VENDOR: id => `/vendors/${id}`,
  MARKETPLACE_LISTING: id => `/marketplace/${id}`,
  HEALTH_DOCTOR: id => `/health/doctors/${id}`,
  HEALTH_CLINIC: id => `/health/clinics/${id}`,
  COURSE: id => `/courses/${id}`,
  WORKSHOP: id => `/workshops/${id}`,
  TRIP: id => `/trips/${id}`,
  RIDE: id => `/trips/rides/${id}`,
  JOB: id => `/jobs/${id}`,
  PROFESSIONAL_SERVICE: id => `/services/${id}`,
};

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function ManaDiscover({ initialQuery = '', initialModules = [] }: ManaDiscoverProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    query, setQuery,
    activeModules, toggleModule,
    response, loading, error,
    loadMore, hasMore,
    recentSearches, clearRecentSearches,
  } = useSearch(initialModules);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleResultClick(result: SearchResultDto) {
    const builder = ROUTE_MAP[result.deepLinkType];
    if (!builder) {
      console.warn('[ManaDiscover] No route for deepLinkType:', result.deepLinkType);
      return;
    }
    navigate(builder(result.deepLinkId));
  }

  function clearAllFilters() {
    activeModules.forEach(m => toggleModule(m));
  }

  const showEmpty = !loading && query.trim() && response && response.total === 0;
  const showResults = response && response.results.length > 0;
  const showRecentPanel = !query.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search everything in your community..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeModules.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeModules.map(m => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                >
                  {MODULE_ICON[m]} {MODULE_LABEL[m]}
                  <button
                    onClick={() => toggleModule(m)}
                    className="ml-0.5 text-indigo-500 hover:text-indigo-800 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex gap-5">
          {/* Sidebar filters — hidden on mobile */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <SearchFilters
              activeModules={activeModules}
              onToggle={toggleModule}
              facets={response?.facets}
              onClearAll={clearAllFilters}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filters button */}
            <div className="lg:hidden mb-3 flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
              >
                ⚙️ Filters
                {activeModules.length > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeModules.length}
                  </span>
                )}
              </button>
              {response && (
                <span className="text-xs text-gray-400">{response.total} results</span>
              )}
            </div>

            {/* Recent searches / category shortcuts */}
            {showRecentPanel && (
              <div className="space-y-5">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Recent searches</span>
                      <button onClick={clearRecentSearches} className="text-xs text-gray-400 hover:text-gray-600">
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(s => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="text-sm text-gray-700 bg-white border border-gray-200 rounded-full px-3 py-1 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                        >
                          🕐 {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm font-semibold text-gray-700 block mb-3">Browse by category</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {MODULE_GROUPS.map(group =>
                      group.modules.map(mod => (
                        <button
                          key={mod.value}
                          onClick={() => { toggleModule(mod.value); inputRef.current?.focus(); }}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                            activeModules.includes(mod.value)
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl">{mod.icon}</span>
                          <span className="text-xs leading-tight">{mod.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && !showResults && (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-10">
                <p className="text-red-500 mb-2">⚠️ {error}</p>
                <button
                  onClick={() => setQuery(query)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Results */}
            {showResults && (
              <div className="space-y-3">
                {/* Result count */}
                <div className="hidden lg:flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {response!.total} result{response!.total !== 1 ? 's' : ''} for <strong>"{query}"</strong>
                    {activeModules.length > 0 && ` in ${activeModules.length} categor${activeModules.length > 1 ? 'ies' : 'y'}`}
                  </span>
                </div>

                {response!.results.map(result => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onClick={handleResultClick}
                  />
                ))}

                {/* Loading more spinner */}
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Load more */}
                {hasMore && !loading && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={loadMore}
                      className="text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-5 py-2 hover:bg-indigo-50 transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {showEmpty && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-700 font-medium">
                  No results for "{query}"
                  {activeModules.length > 0 && ` in ${activeModules.map(m => MODULE_LABEL[m]).join(', ')}`}
                </p>
                <p className="text-sm text-gray-400 mt-1">Try different keywords or remove some filters</p>
                {activeModules.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Clear filters and search all categories
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <MobileFiltersDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        activeModules={activeModules}
        onToggle={toggleModule}
        facets={response?.facets}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
