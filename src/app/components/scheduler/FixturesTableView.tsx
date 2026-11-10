import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, MapPin, Pencil, Download, FileSpreadsheet, FileText, Printer, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface FixtureTableRow {
  id: string;
  key: string;
  matchNumber: number;
  stage: string;
  groupIndex?: number;
  matchIndex?: number;
  isPlayoff: boolean;
  date: string;
  time: string;
  duration: number;
  venueId: number | null;
  courtId: string | null;
  venueName?: string;
  courtName?: string;
  home: { id: string; name: string; flatNumber?: string };
  away: { id: string; name: string; flatNumber?: string };
  conflicts?: string[];
  rawMatch: any;
}

import { type TournamentBreak, getBreakVisualTheme, parseTimeToMinutes } from './breakScheduleUtils';

interface FixturesTableViewProps {
  fixtures: FixtureTableRow[];
  breaks?: TournamentBreak[];
  onEditMatch: (fixture: FixtureTableRow) => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onExportScorecards?: () => void;
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

export function FixturesTableView({
  fixtures,
  breaks,
  onEditMatch,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onExportScorecards,
}: FixturesTableViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'GROUP' | 'PLAYOFF' | 'CONFLICTS'>('ALL');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Group stats
  const totalCount = fixtures.length;
  const groupCount = useMemo(() => fixtures.filter(f => !f.isPlayoff).length, [fixtures]);
  const playoffCount = useMemo(() => fixtures.filter(f => f.isPlayoff).length, [fixtures]);
  const conflictCount = useMemo(() => fixtures.filter(f => f.conflicts && f.conflicts.length > 0).length, [fixtures]);
  const uniqueDatesCount = useMemo(() => new Set(fixtures.map(f => f.date).filter(Boolean)).size, [fixtures]);

  // Filtered fixtures
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      // Stage filter
      if (stageFilter === 'GROUP' && f.isPlayoff) return false;
      if (stageFilter === 'PLAYOFF' && !f.isPlayoff) return false;
      if (stageFilter === 'CONFLICTS' && (!f.conflicts || f.conflicts.length === 0)) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumStr = '#' + f.matchNumber;
        const matchStage = f.stage.toLowerCase();
        const homeName = f.home.name.toLowerCase();
        const awayName = f.away.name.toLowerCase();
        const venueStr = (f.venueName || '').toLowerCase();
        const courtStr = (f.courtName || '').toLowerCase();
        const timeStr = f.time.toLowerCase();

        return (
          matchNumStr.includes(q) ||
          matchStage.includes(q) ||
          homeName.includes(q) ||
          awayName.includes(q) ||
          venueStr.includes(q) ||
          courtStr.includes(q) ||
          timeStr.includes(q)
        );
      }

      return true;
    });
  }, [fixtures, stageFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-4 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Tournament Fixtures Table</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {totalCount} Matches
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological match schedule across {uniqueDatesCount} competition days.
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="relative flex items-center gap-2">
          {conflictCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{conflictCount} Conflicts Found</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Conflicts (All clear)</span>
            </span>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export & Print</span>
            </button>

            {showExportDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white shadow-xl border border-slate-200 p-1.5 z-50 text-xs flex flex-col gap-1">
                  {onExportCSV && (
                    <button
                      type="button"
                      onClick={() => { setShowExportDropdown(false); onExportCSV(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition cursor-pointer text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold">Download CSV</div>
                        <div className="text-[10px] text-slate-400">Excel UTF-8 compatible</div>
                      </div>
                    </button>
                  )}
                  {onExportExcel && (
                    <button
                      type="button"
                      onClick={() => { setShowExportDropdown(false); onExportExcel(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition cursor-pointer text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-semibold">Download Excel (.xls)</div>
                        <div className="text-[10px] text-slate-400">Formatted spreadsheet</div>
                      </div>
                    </button>
                  )}
                  {onExportPDF && (
                    <button
                      type="button"
                      onClick={() => { setShowExportDropdown(false); onExportPDF(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition cursor-pointer text-left"
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">Print Match Schedule</div>
                        <div className="text-[10px] text-slate-400">Official tournament PDF</div>
                      </div>
                    </button>
                  )}
                  {onExportScorecards && (
                    <button
                      type="button"
                      onClick={() => { setShowExportDropdown(false); onExportScorecards(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition cursor-pointer text-left"
                    >
                      <FileText className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-semibold">Umpire Score Sheets</div>
                        <div className="text-[10px] text-slate-400">Printable match cards</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStageFilter('ALL')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ' + (
              stageFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            All Stages ({totalCount})
          </button>
          {groupCount > 0 && (
            <button
              type="button"
              onClick={() => setStageFilter('GROUP')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ' + (
                stageFilter === 'GROUP'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Group / League ({groupCount})
            </button>
          )}
          {playoffCount > 0 && (
            <button
              type="button"
              onClick={() => setStageFilter('PLAYOFF')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ' + (
                stageFilter === 'PLAYOFF'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Playoffs / Knockouts ({playoffCount})
            </button>
          )}
          {conflictCount > 0 && (
            <button
              type="button"
              onClick={() => setStageFilter('CONFLICTS')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ' + (
                stageFilter === 'CONFLICTS'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Conflicts Only ({conflictCount})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search competitor, court..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-32">Stage / Pool</th>
              <th className="py-2.5 px-3 w-36">Date & Day</th>
              <th className="py-2.5 px-3 w-28">Time</th>
              <th className="py-2.5 px-3 w-44">Venue & Court</th>
              <th className="py-2.5 px-3">Competitors (Home vs Away)</th>
              <th className="py-2.5 px-3 w-32 text-center">Status / Conflict</th>
              <th className="py-2.5 px-3 w-16 text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredFixtures.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Filter className="w-6 h-6 text-slate-300" />
                    <span>No matches found matching your filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              (() => {
                const enabledBreaks = (breaks || []).filter(b => b.enabled);
                const renderedBreaks = new Set<string>();

                return filteredFixtures.map(f => {
                  const hasConflict = f.conflicts && f.conflicts.length > 0;
                  const isBye = f.home.id === 'bye' || f.away.id === 'bye' || f.home.name === 'BYE' || f.away.name === 'BYE';
                  const matchTimeMin = parseTimeToMinutes(f.time);

                  // Check if any enabled break on this date starts before or at this match and hasn't been displayed yet
                  const dueBreaks = !isBye
                    ? enabledBreaks.filter(b => {
                        const breakKey = `${f.date}-${b.id}`;
                        if (renderedBreaks.has(breakKey)) return false;
                        const bStart = parseTimeToMinutes(b.startTime);
                        return matchTimeMin >= bStart;
                      })
                    : [];

                  dueBreaks.forEach(b => renderedBreaks.add(`${f.date}-${b.id}`));

                  return (
                    <React.Fragment key={f.key}>
                      {dueBreaks.map(brk => {
                        const theme = getBreakVisualTheme(brk.type);
                        return (
                          <tr
                            key={`break-${f.date}-${brk.id}`}
                            className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border-y border-amber-200"
                          >
                            <td colSpan={8} className="py-2.5 px-4">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{theme.icon}</span>
                                  <span className="text-xs font-bold text-amber-900 tracking-wider uppercase">
                                    {brk.name}
                                  </span>
                                  <span className="text-[11px] text-amber-800 font-semibold">
                                    {brk.startTime} – {brk.endTime}
                                  </span>
                                  <span className="text-[10px] text-amber-700 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                                    {brk.durationMinutes}m pause
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide bg-white/80 px-2.5 py-0.5 rounded-md border border-amber-200">
                                  All Courts Paused · Tournament Break
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr
                        className={'hover:bg-slate-50/70 transition-colors ' + (
                          hasConflict ? 'bg-amber-50/30' : ''
                        )}
                      >
                    {/* Match Number */}
                    <td className="py-2 px-3 text-center font-bold text-slate-500">
                      M{f.matchNumber}
                    </td>

                    {/* Stage */}
                    <td className="py-2 px-3">
                      <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                        f.isPlayoff
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      )}>
                        {f.stage}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {isBye ? <span className="text-slate-400 italic">Auto-Advanced</span> : formatDateSafely(f.date)}
                    </td>

                    {/* Time */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {isBye ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-800 font-semibold">
                          <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{f.time}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({f.duration}m)</span>
                        </div>
                      )}
                    </td>

                    {/* Venue & Court */}
                    <td className="py-2 px-3 text-slate-600">
                      {isBye ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={[f.venueName, f.courtName].filter(Boolean).join(' - ')}>
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">{[f.venueName, f.courtName].filter(Boolean).join(' - ') || 'TBD'}</span>
                        </div>
                      )}
                    </td>

                    {/* Competitors */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {/* Home */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate" title={f.home.name}>
                              {f.home.name}
                            </span>
                            {f.home.flatNumber && (
                              <span className="text-[9px] text-slate-400 truncate">{f.home.flatNumber}</span>
                            )}
                          </div>
                        </div>

                        {/* VS */}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                          VS
                        </span>

                        {/* Away */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate" title={f.away.name}>
                              {f.away.name}
                            </span>
                            {f.away.flatNumber && (
                              <span className="text-[9px] text-slate-400 truncate">{f.away.flatNumber}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Conflict / Status */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {isBye ? (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          BYE
                        </span>
                      ) : hasConflict ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 cursor-help"
                          title={f.conflicts ? f.conflicts.join('\n') : ''}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Conflict</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Ready</span>
                        </span>
                      )}
                    </td>

                    {/* Edit Action */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onEditMatch(f)}
                        className="w-7 h-7 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 flex items-center justify-center transition cursor-pointer mx-auto"
                        title="Edit Match Schedule"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
                  );
                });
              })()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
