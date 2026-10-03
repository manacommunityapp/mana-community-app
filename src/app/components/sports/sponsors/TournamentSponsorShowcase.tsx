import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  ExternalLink,
  Award,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import type { TournamentSponsor } from './TournamentSponsorTypes';

interface TournamentSponsorShowcaseProps {
  sponsors: TournamentSponsor[];
  tournamentName?: string;
  season?: string;
  posterUrl?: string;
  className?: string;
}

export const TournamentSponsorShowcase: React.FC<TournamentSponsorShowcaseProps> = ({
  sponsors,
  season = 'Season 5',
  posterUrl,
  className = '',
}) => {
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);

  if (!sponsors || sponsors.length === 0) return null;

  const presentingSponsors = sponsors.filter(
    (s) =>
      s.tier === 'presenting' ||
      s.tier === 'title' ||
      s.category?.toLowerCase().includes('presenting') ||
      s.category?.toLowerCase().includes('title')
  );

  const poweredBySponsors = sponsors.filter(
    (s) =>
      s.tier === 'poweredBy' ||
      s.category?.toLowerCase().includes('powered') ||
      s.category?.toLowerCase().includes('co-presenting')
  );

  const associateSponsors = sponsors.filter(
    (s) =>
      s.tier === 'gold' ||
      s.tier === 'silver' ||
      s.tier === 'bronze' ||
      s.tier === 'associate' ||
      s.category?.toLowerCase().includes('associate') ||
      s.category?.toLowerCase().includes('proud') ||
      s.category?.toLowerCase().includes('gold') ||
      s.category?.toLowerCase().includes('silver')
  );

  const categoryPartners = sponsors.filter(
    (s) =>
      !presentingSponsors.includes(s) &&
      !poweredBySponsors.includes(s) &&
      !associateSponsors.includes(s)
  );

  return (
    <section
      id="sponsors-showcase"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 text-left ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              Official Partners
            </span>
            <span className="text-xs text-slate-400 font-medium">• {season}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
            Tournament Sponsors & Partners
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            The proud community and corporate brands powering our sporting stage and athletes.
          </p>
        </div>

        {posterUrl && (
          <button
            type="button"
            onClick={() => setSelectedPoster(posterUrl)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Official Poster</span>
          </button>
        )}
      </div>

      {presentingSponsors.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>Presenting Partner</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {presentingSponsors.map((sponsor, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 p-4 sm:p-5 flex items-start justify-between gap-3 shadow-sm hover:border-amber-400 transition-all group"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    {sponsor.category || 'Presenting Sponsor'}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    {sponsor.name}
                  </h4>
                  {sponsor.tagline && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic font-medium line-clamp-2">
                      "{sponsor.tagline}"
                    </p>
                  )}
                </div>

                {sponsor.url && (
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 shadow-2xs transition-transform group-hover:scale-110"
                    title="Visit website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(associateSponsors.length > 0 || poweredBySponsors.length > 0) && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Associate & Proud Partners</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...poweredBySponsors, ...associateSponsors].map((sponsor, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 flex items-start justify-between gap-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[9.5px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {sponsor.category || 'Proud Partner'}
                  </span>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {sponsor.name}
                  </h5>
                  {sponsor.tagline && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {sponsor.tagline}
                    </p>
                  )}
                </div>

                {sponsor.url && (
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-white dark:bg-slate-700 text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 shrink-0 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {categoryPartners.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Category & Event Partners</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {categoryPartners.map((sponsor, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 flex flex-col justify-between text-left space-y-1"
              >
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    {sponsor.category}
                  </span>
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {sponsor.name}
                  </strong>
                </div>
                {sponsor.tagline && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    {sponsor.tagline}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedPoster(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white cursor-pointer z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedPoster}
              alt="Tournament Sponsor Poster"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
};
