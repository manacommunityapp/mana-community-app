import React from 'react';
import { SearchResultDto } from '../../../services/search/searchService';
import { MODULE_ICON, MODULE_LABEL } from './moduleConfig';

interface SearchResultCardProps {
  result: SearchResultDto;
  onClick?: (result: SearchResultDto) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const icon = MODULE_ICON[result.module] ?? '📄';
  const label = MODULE_LABEL[result.module] ?? result.module;
  const visibleTags = result.tags?.slice(0, 3) ?? [];

  return (
    <div
      onClick={() => onClick?.(result)}
      className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.(result)}
    >
      {/* Avatar / image */}
      <div className="flex-shrink-0">
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt={result.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-2xl">
            {icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {icon} {label}
          </span>
        </div>
        <p className="font-semibold text-gray-900 text-sm truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
        )}
        {result.description && (
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {result.description}
          </p>
        )}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {visibleTags.map(tag => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {(result.tags?.length ?? 0) > 3 && (
              <span className="text-xs text-gray-400">+{(result.tags!.length) - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
