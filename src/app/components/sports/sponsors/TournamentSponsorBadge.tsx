import React from 'react';
import { Crown, Sparkles, Award, ExternalLink } from 'lucide-react';
import type { TournamentSponsor } from './TournamentSponsorTypes';

interface TournamentSponsorBadgeProps {
  sponsor: TournamentSponsor;
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
  className?: string;
}

export const TournamentSponsorBadge: React.FC<TournamentSponsorBadgeProps> = ({
  sponsor,
  size = 'sm',
  showLink = false,
  className = '',
}) => {
  const isPresenting =
    sponsor.tier === 'presenting' ||
    sponsor.category?.toLowerCase().includes('presenting') ||
    sponsor.category?.toLowerCase().includes('title');

  const isGold =
    sponsor.tier === 'gold' ||
    sponsor.category?.toLowerCase().includes('gold') ||
    sponsor.category?.toLowerCase().includes('powered');

  const badgeStyle = isPresenting
    ? 'bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30 shadow-2xs'
    : isGold
    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const content = (
    <span
      className={`inline-flex items-center rounded-full font-semibold border transition-all ${badgeStyle} ${sizeClasses} ${className}`}
    >
      {isPresenting ? (
        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
      ) : isGold ? (
        <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
      ) : (
        <Award className="w-3 h-3 text-slate-400 shrink-0" />
      )}
      <span className="opacity-75 uppercase tracking-wider text-[9px] font-bold">
        {sponsor.category}
      </span>
      <span className="font-bold text-foreground truncate max-w-[120px] sm:max-w-[180px]">
        {sponsor.name}
      </span>
      {showLink && sponsor.url && (
        <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
      )}
    </span>
  );

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:scale-[1.02] active:scale-95 transition-transform"
      >
        {content}
      </a>
    );
  }

  return content;
};
