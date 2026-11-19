import React, { useState } from 'react';
import { SearchModule } from '../../../services/search/searchService';
import { MODULE_GROUPS } from './moduleConfig';

interface SearchFiltersProps {
  activeModules: SearchModule[];
  onToggle: (module: SearchModule) => void;
  facets?: Record<string, number>;
  onClearAll?: () => void;
}

function FilterGroup({
  group,
  activeModules,
  onToggle,
  facets,
}: {
  group: typeof MODULE_GROUPS[number];
  activeModules: SearchModule[];
  onToggle: (m: SearchModule) => void;
  facets?: Record<string, number>;
}) {
  const [open, setOpen] = useState(true);
  const activeCount = group.modules.filter(m => activeModules.includes(m.value)).length;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 px-1 text-left"
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {group.label}
          {activeCount > 0 && (
            <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-sm">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="pb-2 space-y-1">
          {group.modules.map(mod => {
            const count = facets?.[mod.value];
            const active = activeModules.includes(mod.value);
            return (
              <label
                key={mod.value}
                className={`flex items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  active ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggle(mod.value)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">{mod.icon}</span>
                <span className={`text-sm flex-1 ${active ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                  {mod.label}
                </span>
                {count !== undefined && (
                  <span className="text-xs text-gray-400">{count}</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SearchFilters({ activeModules, onToggle, facets, onClearAll }: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-800">Filters</span>
        {activeModules.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Clear all ({activeModules.length})
          </button>
        )}
      </div>
      <div className="space-y-0">
        {MODULE_GROUPS.map(group => (
          <FilterGroup
            key={group.label}
            group={group}
            activeModules={activeModules}
            onToggle={onToggle}
            facets={facets}
          />
        ))}
      </div>
    </div>
  );
}

// Mobile drawer variant — triggered by a button
interface MobileFiltersDrawerProps extends SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFiltersDrawer({ isOpen, onClose, ...props }: MobileFiltersDrawerProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto shadow-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-gray-900">Filters</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        <SearchFilters {...props} />
      </div>
    </div>
  );
}
