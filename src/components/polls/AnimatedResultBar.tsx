import React, { useEffect, useRef, useState } from 'react';

interface AnimatedResultBarProps {
  label:       string;
  count:       number;
  total:       number;
  isSelected:  boolean;   // current user voted this
  isWinning:   boolean;   // highest vote count
  delay?:      number;    // stagger in ms
}

export function AnimatedResultBar({
  label, count, total, isSelected, isWinning, delay = 0,
}: AnimatedResultBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), delay + 100);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  const barColor = isSelected
    ? 'bg-indigo-500'
    : isWinning
    ? 'bg-emerald-500'
    : 'bg-gray-300';

  return (
    <div className="flex items-start gap-3 mb-3">
      {/* Checkmark column */}
      <div className="w-5 flex-shrink-0 mt-0.5">
        {isSelected ? (
          <span className="text-indigo-600 font-bold text-sm">✓</span>
        ) : (
          <span className="text-gray-300 text-sm">○</span>
        )}
      </div>

      {/* Bar + labels */}
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-1">
          <span className={`text-sm font-medium leading-snug ${isSelected ? 'text-indigo-700 font-semibold' : 'text-gray-800'} ${isWinning ? 'font-bold' : ''}`}>
            {label}
          </span>
          <span className={`text-sm font-bold ml-2 flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
            {pct}%
          </span>
        </div>

        {/* Track */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ease-out ${barColor}`}
            style={{
              width: `${width}%`,
              transitionDuration: '600ms',
              transitionDelay: `${delay}ms`,
            }}
          />
        </div>

        <p className="text-xs text-gray-400 mt-0.5">
          {count} vote{count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
