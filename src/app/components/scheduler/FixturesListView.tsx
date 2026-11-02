import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Pencil, 
  Calendar, 
  LayoutGrid, 
  List, 
  Shield, 
  Trophy,
  Filter,
  Users,
  Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { FixtureTableRow } from './FixturesTableView';
import { rankStage, exportListViewToPDF } from '../../../utils/sportsExportUtils';

export interface FixturesListViewProps {
  fixtures: FixtureTableRow[];
  onEditMatch: (fixture: FixtureTableRow) => void;
  onExportPDF?: () => void;
  sportName?: string;
}

const DEFAULT_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media';

function formatDateSafely(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return format(d, 'dd MMM yyyy (EEE)');
    }
    const parsed = parseISO(dateStr);
    return isNaN(parsed.getTime()) ? dateStr : format(parsed, 'dd MMM yyyy (EEE)');
  } catch {
    return dateStr;
  }
}

export interface RoundTheme {
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  headerBg: string;
  headerBorder: string;
  cardBorder: string;
  accentGradient: string;
  pillBg: string;
  pillText: string;
  icon: string;
}

export function getRoundTheme(stageName: string): RoundTheme {
  const s = stageName.toLowerCase();

  // Final - Light Golden / Amber
  if (s.includes('final') && !s.includes('semi') && !s.includes('quarter') && !s.includes('third') && !s.includes('bronze')) {
    return {
      name: stageName,
      badgeBg: 'bg-amber-100',
      badgeBorder: 'border-amber-300',
      badgeText: 'text-amber-900',
      headerBg: 'bg-gradient-to-r from-amber-50 via-yellow-50/70 to-amber-50/40',
      headerBorder: 'border-amber-200',
      cardBorder: 'hover:border-amber-400',
      accentGradient: 'from-amber-400 via-amber-500 to-yellow-500',
      pillBg: 'bg-amber-500',
      pillText: 'text-white',
      icon: '🏆',
    };
  }

  // Semi-Final - Light Purple / Indigo
  if (s.includes('semi') || s.includes('sf')) {
    return {
      name: stageName,
      badgeBg: 'bg-purple-100',
      badgeBorder: 'border-purple-300',
      badgeText: 'text-purple-900',
      headerBg: 'bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50/40',
      headerBorder: 'border-purple-200',
      cardBorder: 'hover:border-purple-400',
      accentGradient: 'from-purple-500 via-indigo-500 to-violet-500',
      pillBg: 'bg-purple-600',
      pillText: 'text-white',
      icon: '⚔️',
    };
  }

  // 3rd Place / Bronze - Light Coral / Rose
  if (s.includes('third') || s.includes('bronze') || s.includes('3rd')) {
    return {
      name: stageName,
      badgeBg: 'bg-rose-100',
      badgeBorder: 'border-rose-300',
      badgeText: 'text-rose-900',
      headerBg: 'bg-gradient-to-r from-rose-50 via-orange-50/70 to-rose-50/40',
      headerBorder: 'border-rose-200',
      cardBorder: 'hover:border-rose-400',
      accentGradient: 'from-rose-400 via-rose-500 to-orange-400',
      pillBg: 'bg-rose-500',
      pillText: 'text-white',
      icon: '🥉',
    };
  }

  // Quarter-Final - Light Sky / Cyan
  if (s.includes('quarter') || s.includes('qf')) {
    return {
      name: stageName,
      badgeBg: 'bg-sky-100',
      badgeBorder: 'border-sky-300',
      badgeText: 'text-sky-900',
      headerBg: 'bg-gradient-to-r from-sky-50 via-cyan-50/70 to-sky-50/40',
      headerBorder: 'border-sky-200',
      cardBorder: 'hover:border-sky-400',
      accentGradient: 'from-sky-400 via-cyan-500 to-blue-500',
      pillBg: 'bg-sky-600',
      pillText: 'text-white',
      icon: '🎯',
    };
  }


  // Numbered Rounds: Round 1 / 1st Round - Light Mint / Emerald
  if (/\b(round\s*0?1|1st\s*round|first\s*round|r1)\b/i.test(s)) {
    return {
      name: stageName,
      badgeBg: 'bg-emerald-100',
      badgeBorder: 'border-emerald-300',
      badgeText: 'text-emerald-900',
      headerBg: 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50/40',
      headerBorder: 'border-emerald-200',
      cardBorder: 'hover:border-emerald-400',
      accentGradient: 'from-emerald-400 via-emerald-500 to-teal-500',
      pillBg: 'bg-emerald-600',
      pillText: 'text-white',
      icon: '🌱',
    };
  }

  // Round 2 / 2nd Round - Light Sky / Cyan
  if (/\b(round\s*0?2|2nd\s*round|second\s*round|r2)\b/i.test(s)) {
    return {
      name: stageName,
      badgeBg: 'bg-sky-100',
      badgeBorder: 'border-sky-300',
      badgeText: 'text-sky-900',
      headerBg: 'bg-gradient-to-r from-sky-50 via-cyan-50/70 to-sky-50/40',
      headerBorder: 'border-sky-200',
      cardBorder: 'hover:border-sky-400',
      accentGradient: 'from-sky-400 via-cyan-500 to-blue-500',
      pillBg: 'bg-sky-600',
      pillText: 'text-white',
      icon: '⚡',
    };
  }

  // Round 3 / 3rd Round - Light Teal
  if (/\b(round\s*0?3|3rd\s*round|third\s*round|r3)\b/i.test(s)) {
    return {
      name: stageName,
      badgeBg: 'bg-teal-100',
      badgeBorder: 'border-teal-300',
      badgeText: 'text-teal-900',
      headerBg: 'bg-gradient-to-r from-teal-50 via-cyan-50/70 to-teal-50/40',
      headerBorder: 'border-teal-200',
      cardBorder: 'hover:border-teal-400',
      accentGradient: 'from-teal-400 via-teal-500 to-cyan-500',
      pillBg: 'bg-teal-600',
      pillText: 'text-white',
      icon: '🎯',
    };
  }

  // Round 4 / 4th Round - Light Indigo / Blue
  if (/\b(round\s*0?4|4th\s*round|fourth\s*round|r4)\b/i.test(s)) {
    return {
      name: stageName,
      badgeBg: 'bg-indigo-100',
      badgeBorder: 'border-indigo-300',
      badgeText: 'text-indigo-900',
      headerBg: 'bg-gradient-to-r from-indigo-50 via-blue-50/60 to-indigo-50/30',
      headerBorder: 'border-indigo-200',
      cardBorder: 'hover:border-indigo-400',
      accentGradient: 'from-indigo-400 via-blue-500 to-violet-500',
      pillBg: 'bg-indigo-600',
      pillText: 'text-white',
      icon: '💫',
    };
  }

  // Round of 16 - Light Mint / Emerald
  if (s.includes('16') || s.includes('round of 16') || s.includes('r16')) {
    return {
      name: stageName,
      badgeBg: 'bg-emerald-100',
      badgeBorder: 'border-emerald-300',
      badgeText: 'text-emerald-900',
      headerBg: 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50/40',
      headerBorder: 'border-emerald-200',
      cardBorder: 'hover:border-emerald-400',
      accentGradient: 'from-emerald-400 via-emerald-500 to-teal-500',
      pillBg: 'bg-emerald-600',
      pillText: 'text-white',
      icon: '⚡',
    };
  }

  // Round of 32 - Light Teal
  if (s.includes('32') || s.includes('round of 32') || s.includes('r32')) {
    return {
      name: stageName,
      badgeBg: 'bg-teal-100',
      badgeBorder: 'border-teal-300',
      badgeText: 'text-teal-900',
      headerBg: 'bg-gradient-to-r from-teal-50 via-cyan-50/70 to-teal-50/40',
      headerBorder: 'border-teal-200',
      cardBorder: 'hover:border-teal-400',
      accentGradient: 'from-teal-400 via-teal-500 to-cyan-500',
      pillBg: 'bg-teal-600',
      pillText: 'text-white',
      icon: '🏸',
    };
  }

  // Group 1 / Pool A - Light Blue
  if (s.includes('group 1') || s.includes('group a') || s.includes('pool a')) {
    return {
      name: stageName,
      badgeBg: 'bg-blue-100',
      badgeBorder: 'border-blue-300',
      badgeText: 'text-blue-900',
      headerBg: 'bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50/30',
      headerBorder: 'border-blue-200',
      cardBorder: 'hover:border-blue-400',
      accentGradient: 'from-blue-500 to-indigo-500',
      pillBg: 'bg-blue-600',
      pillText: 'text-white',
      icon: '🛡️',
    };
  }

  // Group 2 / Pool B - Light Teal
  if (s.includes('group 2') || s.includes('group b') || s.includes('pool b')) {
    return {
      name: stageName,
      badgeBg: 'bg-teal-100',
      badgeBorder: 'border-teal-300',
      badgeText: 'text-teal-900',
      headerBg: 'bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50/30',
      headerBorder: 'border-teal-200',
      cardBorder: 'hover:border-teal-400',
      accentGradient: 'from-teal-500 to-emerald-500',
      pillBg: 'bg-teal-600',
      pillText: 'text-white',
      icon: '🛡️',
    };
  }

  // Group 3 / Pool C - Light Fuchsia / Pink
  if (s.includes('group 3') || s.includes('group c') || s.includes('pool c')) {
    return {
      name: stageName,
      badgeBg: 'bg-fuchsia-100',
      badgeBorder: 'border-fuchsia-300',
      badgeText: 'text-fuchsia-900',
      headerBg: 'bg-gradient-to-r from-fuchsia-50 via-pink-50/60 to-fuchsia-50/30',
      headerBorder: 'border-fuchsia-200',
      cardBorder: 'hover:border-fuchsia-400',
      accentGradient: 'from-fuchsia-500 to-pink-500',
      pillBg: 'bg-fuchsia-600',
      pillText: 'text-white',
      icon: '🛡️',
    };
  }

  // Group 4 / Pool D - Light Orange
  if (s.includes('group 4') || s.includes('group d') || s.includes('pool d')) {
    return {
      name: stageName,
      badgeBg: 'bg-orange-100',
      badgeBorder: 'border-orange-300',
      badgeText: 'text-orange-900',
      headerBg: 'bg-gradient-to-r from-orange-50 via-amber-50/60 to-orange-50/30',
      headerBorder: 'border-orange-200',
      cardBorder: 'hover:border-orange-400',
      accentGradient: 'from-orange-500 to-amber-500',
      pillBg: 'bg-orange-600',
      pillText: 'text-white',
      icon: '🛡️',
    };
  }

  // Round Robin / League - Light Indigo
  if (s.includes('round robin') || s.includes('league')) {
    return {
      name: stageName,
      badgeBg: 'bg-indigo-100',
      badgeBorder: 'border-indigo-300',
      badgeText: 'text-indigo-900',
      headerBg: 'bg-gradient-to-r from-indigo-50 via-blue-50/60 to-indigo-50/30',
      headerBorder: 'border-indigo-200',
      cardBorder: 'hover:border-indigo-400',
      accentGradient: 'from-indigo-500 to-blue-600',
      pillBg: 'bg-indigo-600',
      pillText: 'text-white',
      icon: '🔄',
    };
  }

  // Default / Other Stages
  return {
    name: stageName,
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-800',
    headerBg: 'bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50/40',
    headerBorder: 'border-slate-200',
    cardBorder: 'hover:border-slate-400',
    accentGradient: 'from-slate-400 to-slate-600',
    pillBg: 'bg-slate-700',
    pillText: 'text-white',
    icon: '📋',
  };
}

export function FixturesListView({
  fixtures,
  onEditMatch,
  onExportPDF,
  sportName = 'Match',
}: FixturesListViewProps) {
  const handleDownloadPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      exportListViewToPDF(
        filteredFixtures.length > 0 ? filteredFixtures : fixtures,
        `${sportName} Fixtures Schedule (List View)`,
        'Mana Community Sports',
        sportName
      );
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'rows'>('cards');

  // Distinct Stages in tournament order
  const distinctStages = useMemo(() => {
    const stageSet = new Set<string>();
    fixtures.forEach(f => {
      if (f.stage) stageSet.add(f.stage);
    });
    return Array.from(stageSet).sort((a, b) => rankStage(a) - rankStage(b));
  }, [fixtures]);

  // Filtered Fixtures
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      // Stage filter
      if (selectedStage !== 'ALL' && f.stage !== selectedStage) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numStr = '#' + f.matchNumber;
        const stageStr = f.stage.toLowerCase();
        const homeName = (f.home?.name || '').toLowerCase();
        const awayName = (f.away?.name || '').toLowerCase();
        const venueStr = (f.venueName || '').toLowerCase();
        const courtStr = (f.courtName || '').toLowerCase();
        const timeStr = (f.time || '').toLowerCase();

        return (
          numStr.includes(q) ||
          stageStr.includes(q) ||
          homeName.includes(q) ||
          awayName.includes(q) ||
          venueStr.includes(q) ||
          courtStr.includes(q) ||
          timeStr.includes(q)
        );
      }

      return true;
    });
  }, [fixtures, selectedStage, searchQuery]);

  // Group filtered fixtures by stage
  const groupedByStage = useMemo(() => {
    const map = new Map<string, FixtureTableRow[]>();
    filteredFixtures.forEach(f => {
      const stage = f.stage || 'General';
      if (!map.has(stage)) {
        map.set(stage, []);
      }
      map.get(stage)!.push(f);
    });

    return Array.from(map.entries()).sort((a, b) => rankStage(a[0]) - rankStage(b[0]));
  }, [filteredFixtures]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter & View Controls */}
      <div className="bg-white rounded-2xl p-4 border border-[rgba(99,102,241,0.12)] shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by player, team, court, or time..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Download List View Button with Pastel Round Colors */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm transition cursor-pointer"
              title="Download & Print colored round-by-round tournament list"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download List View</span>
            </button>
          </div>

          {/* Layout Mode Toggle: Cards vs Rows */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Layout:</span>
            <div className="flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setLayoutMode('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none ${
                  layoutMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('rows')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none ${
                  layoutMode === 'rows'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Compact Rows</span>
              </button>
            </div>
          </div>
        </div>

        {/* Round / Stage Filter Chips in Distinct Light Pastel Colors */}
        {distinctStages.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStage('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border shrink-0 ${
                selectedStage === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              All Rounds ({fixtures.length})
            </button>

            {distinctStages.map(stageName => {
              const theme = getRoundTheme(stageName);
              const count = fixtures.filter(f => f.stage === stageName).length;
              const isSelected = selectedStage === stageName;

              return (
                <button
                  key={stageName}
                  type="button"
                  onClick={() => setSelectedStage(stageName)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border shrink-0 ${
                    isSelected
                      ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} ring-2 ring-indigo-400 shadow-sm`
                      : `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} hover:opacity-90`
                  }`}
                >
                  <span>{theme.icon}</span>
                  <span>{stageName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/80 font-bold border border-black/5">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State */}
      {groupedByStage.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-[rgba(99,102,241,0.12)] text-center">
          <p className="text-base font-bold text-slate-700">No matches found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No results matching "${searchQuery}".` : 'No matches scheduled yet.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-indigo-600 font-bold hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      )}

      {/* Matches Grouped by Round with Distinct Light Colors */}
      {groupedByStage.map(([stageName, stageMatches]) => {
        const theme = getRoundTheme(stageName);
        const stageDates = Array.from(new Set(stageMatches.map(m => m.date).filter(Boolean)));

        return (
          <div key={stageName} className="flex flex-col gap-3">
            {/* Round Banner with Light Colored Gradient Theme */}
            <div className={`rounded-2xl p-3.5 sm:p-4 border shadow-sm ${theme.headerBg} ${theme.headerBorder} flex flex-wrap items-center justify-between gap-3`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">{theme.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {stageName}
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                      {stageMatches.length} {stageMatches.length === 1 ? 'Match' : 'Matches'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {sportName} · {stageMatches[0]?.isPlayoff ? 'Knockout Elimination' : 'Stage Fixtures'}
                  </p>
                </div>
              </div>

              {/* Date Summary Tag */}
              {stageDates.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-white/70 px-3 py-1.5 rounded-xl border border-black/5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>
                    {stageDates.map(d => formatDateSafely(d)).join(' · ')}
                  </span>
                </div>
              )}
            </div>

            {/* Layout: CARDS GRID */}
            {layoutMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageMatches.map(m => {
                  const hasConflicts = m.conflicts && m.conflicts.length > 0;
                  const courtDisplay = [m.venueName, m.courtName].filter(Boolean).join(' - ') || 'TBD';

                  return (
                    <div
                      key={m.id}
                      className={`bg-white border border-[rgba(99,102,241,0.14)] rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg ${theme.cardBorder} transition-all duration-200 flex flex-col justify-between`}
                    >
                      {/* Top Round Color Accent Line */}
                      <div className={`w-full h-1.5 bg-gradient-to-r ${theme.accentGradient}`} />

                      {/* Header with Round Tag & Match Number */}
                      <div className="px-4 pt-3 pb-2.5 border-b border-slate-100 bg-slate-50/40">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                            <span>{theme.icon}</span>
                            <span>{stageName} · Match #{m.matchNumber}</span>
                          </span>

                          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>{m.time}</span>
                            {m.duration ? <span className="text-[10px] text-slate-400 font-normal">({m.duration}m)</span> : null}
                          </div>
                        </div>

                        {/* Date & Court Info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-slate-700">{formatDateSafely(m.date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-right truncate max-w-[50%]" title={courtDisplay}>
                            <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{courtDisplay}</span>
                          </div>
                        </div>
                      </div>

                      {/* Competitor VS Section */}
                      <div className="p-4 flex flex-col gap-3">
                        {/* Horizontal Desktop VS */}
                        <div className="hidden sm:flex items-center justify-between gap-2 p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                          {/* Home Competitor */}
                          <div className="flex items-center gap-2.5 w-[42%] min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate" title={m.home.name}>
                                {m.home.name}
                              </span>
                              {m.home.flatNumber && (
                                <span className="text-[10px] text-slate-500 truncate">{m.home.flatNumber}</span>
                              )}
                            </div>
                          </div>

                          {/* VS Badge */}
                          <div className="flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              VS
                            </span>
                          </div>

                          {/* Away Competitor */}
                          <div className="flex items-center justify-end gap-2.5 w-[42%] min-w-0 text-right">
                            <div className="flex flex-col min-w-0 items-end">
                              <span className="text-xs font-bold text-slate-900 truncate" title={m.away.name}>
                                {m.away.name}
                              </span>
                              {m.away.flatNumber && (
                                <span className="text-[10px] text-slate-500 truncate">{m.away.flatNumber}</span>
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>

                        {/* Mobile Vertical VS */}
                        <div className="flex sm:hidden flex-col gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden shrink-0">
                              <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate">{m.home.name}</span>
                              {m.home.flatNumber && <span className="text-[10px] text-slate-500">{m.home.flatNumber}</span>}
                            </div>
                          </div>

                          <div className="flex items-center justify-center py-0.5 border-y border-slate-200/50 my-0.5">
                            <span className="text-[9px] font-black text-indigo-600">VS</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden shrink-0">
                              <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate">{m.away.name}</span>
                              {m.away.flatNumber && <span className="text-[10px] text-slate-500">{m.away.flatNumber}</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Footer */}
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Scheduled
                          </span>

                          {hasConflicts && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                              title={m.conflicts?.join('\n')}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conflict</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onEditMatch(m)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layout: COMPACT ROWS */}
            {layoutMode === 'rows' && (
              <div className="bg-white rounded-2xl border border-[rgba(99,102,241,0.12)] overflow-hidden divide-y divide-slate-100 shadow-sm">
                {stageMatches.map(m => {
                  const hasConflicts = m.conflicts && m.conflicts.length > 0;
                  const courtDisplay = [m.venueName, m.courtName].filter(Boolean).join(' - ') || 'TBD';

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 ${
                        hasConflicts ? 'border-l-amber-500' : 'border-l-indigo-500'
                      }`}
                    >
                      {/* Match ID & Timing */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                          #{m.matchNumber}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <span>{m.time}</span>
                            <span className="text-slate-300">·</span>
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDateSafely(m.date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{courtDisplay}</span>
                          </div>
                        </div>
                      </div>

                      {/* Competitor Pair */}
                      <div className="flex-1 flex items-center justify-start md:justify-center gap-3 min-w-0 px-2">
                        <div className="flex items-center gap-2 min-w-0 max-w-[40%]">
                          <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0">
                            <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate" title={m.home.name}>
                            {m.home.name}
                          </span>
                        </div>

                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          VS
                        </span>

                        <div className="flex items-center gap-2 min-w-0 max-w-[40%]">
                          <span className="text-xs font-bold text-slate-900 truncate" title={m.away.name}>
                            {m.away.name}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0">
                            <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Status, Conflict & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
                        {hasConflicts && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                            title={m.conflicts?.join('\n')}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Conflict</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Scheduled
                        </span>

                        <button
                          type="button"
                          onClick={() => onEditMatch(m)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
