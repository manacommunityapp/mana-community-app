import React from 'react';
import type { Badge } from '../../types/sports-enhanced';

const RARITY_STYLE = {
  common:    { border: 'border-gray-200',  bg: 'bg-gray-50',   label: 'text-gray-500',   strip: 'bg-gray-200'   },
  rare:      { border: 'border-blue-300',  bg: 'bg-blue-50',   label: 'text-blue-700',   strip: 'bg-blue-400'   },
  epic:      { border: 'border-purple-300',bg: 'bg-purple-50', label: 'text-purple-700', strip: 'bg-purple-500' },
  legendary: { border: 'border-amber-300', bg: 'bg-amber-50',  label: 'text-amber-700',  strip: 'bg-amber-400'  },
} as const;

interface BadgeCardProps {
  badge:    Badge;
  size?:    'sm' | 'md' | 'lg';
  tooltip?: boolean;
}

export function BadgeCard({ badge, size = 'md', tooltip = true }: BadgeCardProps) {
  const s = RARITY_STYLE[badge.rarity] ?? RARITY_STYLE.common;

  const sizeClasses = {
    sm: { wrap: 'w-16 p-2', emoji: 'text-xl', name: 'text-[9px]' },
    md: { wrap: 'w-20 p-3', emoji: 'text-2xl', name: 'text-[10px]' },
    lg: { wrap: 'w-24 p-4', emoji: 'text-4xl', name: 'text-xs'    },
  }[size];

  return (
    <div
      className={[
        'relative flex flex-col items-center gap-1 rounded-xl border-2 transition-transform hover:scale-105',
        sizeClasses.wrap,
        badge.isEarned ? `${s.border} ${s.bg}` : 'border-gray-200 bg-gray-100',
        tooltip ? 'group cursor-pointer' : '',
      ].join(' ')}
      title={tooltip ? `${badge.name}: ${badge.description}` : undefined}
    >
      {/* Rarity strip */}
      {badge.isEarned && badge.rarity !== 'common' && (
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${s.strip}`} />
      )}

      <span
        className={`${sizeClasses.emoji} ${!badge.isEarned ? 'opacity-30 grayscale' : ''}`}
      >
        {badge.emoji}
      </span>

      <span className={`${sizeClasses.name} font-bold text-center leading-tight ${badge.isEarned ? s.label : 'text-gray-400'}`}>
        {badge.name}
      </span>

      {badge.isEarned && badge.rarity !== 'common' && (
        <span className={`text-[8px] font-black uppercase tracking-wide ${s.label}`}>
          {badge.rarity}
        </span>
      )}

      {/* Lock icon if not earned */}
      {!badge.isEarned && (
        <span className="absolute top-1 right-1 text-xs">🔒</span>
      )}

      {/* Tooltip on hover */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg pointer-events-none">
          <p className="font-bold">{badge.name}</p>
          <p className="text-gray-300 mt-0.5">{badge.description}</p>
          {badge.earnedAt && (
            <p className="text-gray-400 mt-1 text-[10px]">
              Earned {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function BadgeGrid({ badges, showLocked = false }: { badges: Badge[]; showLocked?: boolean }) {
  const earned = badges.filter((b) => b.isEarned);
  const locked = badges.filter((b) => !b.isEarned);

  if (earned.length === 0 && !showLocked) {
    return (
      <p className="text-sm text-gray-500 py-3">No badges earned yet. Play more matches!</p>
    );
  }

  return (
    <div className="space-y-3">
      {earned.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {earned.map((b) => <BadgeCard key={b.id} badge={b} />)}
        </div>
      )}
      {showLocked && locked.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Locked</p>
          <div className="flex flex-wrap gap-2">
            {locked.map((b) => <BadgeCard key={b.id} badge={b} />)}
          </div>
        </>
      )}
    </div>
  );
}
