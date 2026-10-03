import React from 'react';
import { Crown, ExternalLink, ChevronRight } from 'lucide-react';
import type { TournamentSponsor } from './TournamentSponsorTypes';

interface TournamentSponsorBannerProps {
  sponsors: TournamentSponsor[];
  tournamentName?: string;
  variant?: 'hero' | 'strip' | 'compact';
  className?: string;
  onExploreClick?: () => void;
}

export const TournamentSponsorBanner: React.FC<TournamentSponsorBannerProps> = ({
  sponsors,
  tournamentName,
  variant = 'hero',
  className = '',
  onExploreClick,
}) => {
  if (!sponsors || sponsors.length === 0) return null;

  const presentingSponsor =
    sponsors.find(
      (s) =>
        s.tier === 'presenting' ||
        s.category?.toLowerCase().includes('presenting') ||
        s.category?.toLowerCase().includes('title')
    ) || sponsors[0];

  const coSponsors = sponsors.filter((s) => s !== presentingSponsor).slice(0, 4);

  if (variant === 'strip' || variant === 'compact') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-indigo-950/90 p-2 sm:p-2.5 flex items-center justify-between gap-3 text-white shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
                {presentingSponsor.category || 'Presenting Sponsor'}
              </span>
              <span className="text-xs font-bold text-slate-100 truncate">
                {presentingSponsor.name}
              </span>
              {presentingSponsor.tagline && (
                <span className="text-[10px] text-slate-300 hidden md:inline opacity-85">
                  • {presentingSponsor.tagline}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {coSponsors.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10">
              {coSponsors.map((cs, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-slate-300 truncate max-w-[100px]"
                  title={`${cs.category}: ${cs.name}`}
                >
                  {cs.name}
                </span>
              ))}
            </div>
          )}
          {presentingSponsor.url && (
            <a
              href={presentingSponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white shadow-lg transition-all ${className}`}
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 text-left min-w-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/40 p-2 flex items-center justify-center shrink-0 shadow-inner">
            {presentingSponsor.logoUrl ? (
              <img
                src={presentingSponsor.logoUrl}
                alt={presentingSponsor.name}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            )}
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[9.5px] font-black uppercase tracking-wider">
                👑 {presentingSponsor.category || 'Presenting Sponsor'}
              </span>
              {tournamentName && (
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  for {tournamentName}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-1 line-clamp-1">
              {presentingSponsor.name}
            </h3>

            {presentingSponsor.tagline ? (
              <p className="text-xs text-slate-300/90 font-medium mt-0.5 line-clamp-1 italic">
                "{presentingSponsor.tagline}"
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Official tournament partner powering community sports excellence
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {coSponsors.length > 0 && (
            <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold text-slate-400">Partners:</span>
              <div className="flex items-center gap-1">
                {coSponsors.map((cs, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-slate-200"
                    title={`${cs.category}: ${cs.name}`}
                  >
                    {cs.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {presentingSponsor.url && (
            <a
              href={presentingSponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Explore Sponsor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {onExploreClick && (
            <button
              type="button"
              onClick={onExploreClick}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            >
              <span>All Sponsors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
