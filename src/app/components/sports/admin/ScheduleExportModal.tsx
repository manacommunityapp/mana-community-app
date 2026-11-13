import { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Layers,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Home,
  Files,
  Sparkles,
} from 'lucide-react';
import {
  exportScheduleToCSV,
  exportScheduleToExcel,
  exportScheduleToPDF,
} from '../../../../utils/sportsExportUtils';
import { showSuccess, showWarning } from '../../../../utils/ToastUtils';

export type TournamentStageKey =
  | 'ALL'
  | 'GROUP'
  | 'ROUND_OF_64'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL'
  | 'THIRD_PLACE';

export interface StageOption {
  key: TournamentStageKey;
  label: string;
  count: number;
}

/** Determines which tournament stage a match belongs to. */
export function getMatchStage(m: any): TournamentStageKey {
  const roundStr = String(m.round || m.roundName || m.roundType || '').trim().toUpperCase();
  const stageStr = String(m.stage || '').trim().toUpperCase();
  const groupStr = String(m.groupName || '').trim().toUpperCase();

  // 1. Group Stage / League Matches (checked early to protect against tournament/event names)
  if (
    roundStr === 'GROUP_STAGE' || roundStr === 'LEAGUE_MATCH' ||
    stageStr === 'GROUP' || stageStr === 'ROUND_ROBIN' ||
    groupStr.startsWith('GROUP') || groupStr.startsWith('POOL')
  ) {
    return 'GROUP';
  }

  // 2. Third Place Match
  if (
    roundStr === 'THIRD_PLACE' ||
    roundStr.includes('THIRD') || roundStr.includes('3RD') || roundStr.includes('BRONZE') ||
    groupStr.includes('THIRD') || groupStr.includes('3RD') || groupStr.includes('BRONZE')
  ) {
    return 'THIRD_PLACE';
  }

  // 3. Final / Grand Final (strict: exact match or clean word boundary, never loose substring)
  if (
    roundStr === 'FINAL' || roundStr === 'GRAND_FINAL' || roundStr === 'FINALS' ||
    /^(GRAND[\s_-]?)?FINALS?$/i.test(roundStr) ||
    /^(GRAND[\s_-]?)?FINALS?$/i.test(groupStr)
  ) {
    return 'FINAL';
  }

  // 4. Semi-Finals
  if (
    roundStr === 'SEMI_FINAL' || roundStr.includes('SEMI') || /\bSF\b/i.test(roundStr) ||
    groupStr.includes('SEMI') || /\bSF\b/i.test(groupStr)
  ) {
    return 'SEMI_FINAL';
  }

  // 5. Quarter-Finals
  if (
    roundStr === 'QUARTER_FINAL' || roundStr.includes('QUARTER') || /\bQF\b/i.test(roundStr) ||
    groupStr.includes('QUARTER') || /\bQF\b/i.test(groupStr)
  ) {
    return 'QUARTER_FINAL';
  }

  // 6. Round of 64
  if (
    roundStr === 'ROUND_OF_64' ||
    roundStr.includes('ROUND OF 64') ||
    roundStr.includes('R64') ||
    roundStr.includes('1/32') ||
    /\b64\b/.test(roundStr) ||
    groupStr.includes('ROUND OF 64') ||
    /\b64\b/.test(groupStr)
  ) {
    return 'ROUND_OF_64';
  }

  // 7. Round of 32
  if (
    roundStr === 'ROUND_OF_32' ||
    roundStr.includes('ROUND OF 32') ||
    roundStr.includes('R32') ||
    roundStr.includes('1/16') ||
    /\b32\b/.test(roundStr) ||
    groupStr.includes('ROUND OF 32') ||
    /\b32\b/.test(groupStr)
  ) {
    return 'ROUND_OF_32';
  }

  // 8. Round of 16 / Pre-Quarters
  if (
    roundStr === 'ROUND_OF_16' ||
    roundStr.includes('ROUND OF 16') ||
    roundStr.includes('R16') ||
    roundStr.includes('1/8') ||
    roundStr.includes('PRE-QUARTER') ||
    /\b16\b/.test(roundStr) ||
    groupStr.includes('ROUND OF 16') ||
    groupStr.includes('PRE-QUARTER') ||
    /\b16\b/.test(groupStr)
  ) {
    return 'ROUND_OF_16';
  }

  // Generic "Round 1" of a knockout bracket
  if (
    roundStr === 'ROUND 1' || roundStr === 'ROUND_1' ||
    /ROUND[\s_-]*1\b/i.test(groupStr) || /ROUND[\s_-]*1\b/i.test(roundStr)
  ) {
    const matchNum = Number(m.matchNumber || m.matchId || 0);
    const bracketSlot = Number(m.bracketSlot || 0);
    if (matchNum > 16 || bracketSlot > 32) return 'ROUND_OF_64';
    if (matchNum > 8 || bracketSlot > 16) return 'ROUND_OF_32';
    return 'ROUND_OF_16';
  }

  // Default fallback
  if (stageStr === 'KNOCKOUT' || stageStr === 'PLAYOFF') {
    return 'ROUND_OF_16';
  }

  return 'GROUP';
}

/** Extracts date and 12-hour AM/PM time from match object. */
export function extractDateTime(m: any): { date: string; time: string } {
  let date = m.date || m.matchDate || '';
  let time = m.time || m.matchTime || '';

  if (m.scheduledAt) {
    const s = String(m.scheduledAt).trim();
    if (s.includes('T')) {
      const parts = s.split('T');
      if (!date) date = parts[0];
      const rawTime = parts[1];
      if (!time) {
        if (rawTime.toUpperCase().includes('AM') || rawTime.toUpperCase().includes('PM')) {
          time = rawTime.trim();
        } else {
          const timeParts = rawTime.split(':');
          if (timeParts.length >= 2) {
            let h = parseInt(timeParts[0], 10);
            const min = timeParts[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            let h12 = h % 12;
            if (h12 === 0) h12 = 12;
            time = `${String(h12).padStart(2, '0')}:${min} ${ampm}`;
          } else {
            time = rawTime;
          }
        }
      }
    } else if (!date) {
      date = s;
    }
  }

  if (time && !time.toUpperCase().includes('AM') && !time.toUpperCase().includes('PM')) {
    const mMatch = time.trim().match(/^(\d{1,2}):(\d{2})/);
    if (mMatch) {
      let h = parseInt(mMatch[1], 10);
      const min = mMatch[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      time = `${String(h12).padStart(2, '0')}:${min} ${ampm}`;
    }
  }

  return { date, time };
}

/** Extracts flat details for both teams/players. */
export function extractFlatDetails(m: any): { team1Flat: string; team2Flat: string } {
  const team1Flat =
    m.team1Flat ||
    m.homeFlat ||
    m.teamAFlat ||
    (typeof m.home === 'object' ? m.home?.flatNumber : '') ||
    '—';

  const team2Flat =
    m.team2Flat ||
    m.awayFlat ||
    m.teamBFlat ||
    (typeof m.away === 'object' ? m.away?.flatNumber : '') ||
    '—';

  return {
    team1Flat: team1Flat && team1Flat !== '—' ? team1Flat : '—',
    team2Flat: team2Flat && team2Flat !== '—' ? team2Flat : '—',
  };
}

/** Extracts names for both teams/players. */
export function extractTeamNames(m: any): { team1: string; team2: string } {
  const team1 =
    m.team1 ||
    m.teamAName ||
    m.homeTeamName ||
    (typeof m.home === 'string' ? m.home : m.home?.name) ||
    'TBD';

  const team2 =
    m.team2 ||
    m.teamBName ||
    m.awayTeamName ||
    (typeof m.away === 'string' ? m.away : m.away?.name) ||
    'TBD';

  return { team1, team2 };
}

/** Extracts venue and court string. */
export function extractVenueCourt(m: any): string {
  const venue = m.venueName || m.venue || '';
  const court = m.courtName || m.courtId || '';
  if (venue && court) {
    if (typeof court === 'string' && court.toLowerCase().startsWith('court')) {
      return `${venue} · ${court}`;
    }
    return `${venue} · Court ${court}`;
  }
  return venue || court || 'Main Arena';
}

export function detectSportName(text?: string | null): string | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  if (t.includes('cricket')) return 'Cricket';
  if (t.includes('badminton') || t.includes('shuttle')) return 'Badminton';
  if (t.includes('table tennis') || t.includes('ping pong') || /\btt\b/.test(t)) return 'Table Tennis';
  if (t.includes('tennis')) return 'Tennis';
  if (t.includes('football') || t.includes('soccer')) return 'Football';
  if (t.includes('basketball')) return 'Basketball';
  if (t.includes('volleyball')) return 'Volleyball';
  if (t.includes('pickleball')) return 'Pickleball';
  if (t.includes('squash')) return 'Squash';
  if (t.includes('chess')) return 'Chess';
  if (t.includes('carrom')) return 'Carrom';
  if (t.includes('swimming')) return 'Swimming';
  if (t.includes('kabaddi')) return 'Kabaddi';
  if (t.includes('throwball')) return 'Throwball';
  if (t.includes('athletics') || t.includes('marathon') || t.includes('running')) return 'Athletics';
  return undefined;
}

export function prepareExportableMatches(
  matches: any[],
  stageFilter: TournamentStageKey = 'ALL',
  defaultSportName?: string
): any[] {
  const filtered = stageFilter === 'ALL'
    ? matches
    : matches.filter(m => {
        const stage = getMatchStage(m);
        if (stageFilter === 'FINAL') return stage === 'FINAL' || stage === 'THIRD_PLACE';
        return stage === stageFilter;
      });

  return filtered.map((m, idx) => {
    const { team1, team2 } = extractTeamNames(m);
    const { team1Flat, team2Flat } = extractFlatDetails(m);
    const { date, time } = extractDateTime(m);
    const venueCourt = extractVenueCourt(m);
    const stageKey = getMatchStage(m);

    const stageLabel =
      stageKey === 'GROUP' ? (m.groupName || 'Group Stage') :
      stageKey === 'QUARTER_FINAL' ? 'Quarter-Finals' :
      stageKey === 'SEMI_FINAL' ? 'Semi-Finals' :
      stageKey === 'FINAL' ? 'Final' :
      stageKey === 'THIRD_PLACE' ? '3rd Place' :
      stageKey === 'ROUND_OF_64' ? 'Round of 64' :
      stageKey === 'ROUND_OF_32' ? 'Round of 32' :
      stageKey === 'ROUND_OF_16' ? 'Round of 16' : 'Match';

    const s1 = m.scoreTeamA ?? m.score1 ?? m.homeScore;
    const s2 = m.scoreTeamB ?? m.score2 ?? m.awayScore;
    const score = s1 != null && s2 != null && (s1 !== '' || s2 !== '') ? `${s1} - ${s2}` : '—';

    const detectedSport =
      m.sport ||
      m.sportName ||
      m.config?.sportName ||
      m.config?.eventName ||
      defaultSportName ||
      detectSportName(m.tournamentName) ||
      detectSportName(m.name) ||
      detectSportName(m.eventName) ||
      'Tournament';

    return {
      matchNumber: m.matchNumber || idx + 1,
      round: stageLabel,
      roundName: stageLabel,
      stage: stageLabel,
      sport: detectedSport,
      sportName: detectedSport,
      date,
      time,
      venue: venueCourt,
      courtName: venueCourt,
      team1,
      team2,
      team1Flat,
      team2Flat,
      homeFlat: team1Flat,
      awayFlat: team2Flat,
      home: { name: team1, flatNumber: team1Flat },
      away: { name: team2, flatNumber: team2Flat },
      score,
      status: m.status || 'SCHEDULED',
      winnerName: m.winnerName || m.winner || '—',
    };
  });
}

export interface ScheduleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  matches: any[];
  defaultStage?: TournamentStageKey;
  sportName?: string;
}

export function ScheduleExportModal({
  isOpen,
  onClose,
  tournamentName,
  matches,
  defaultStage = 'ALL',
  sportName,
}: ScheduleExportModalProps) {
  const [selectedStage, setSelectedStage] = useState<TournamentStageKey>(defaultStage);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const resolvedSport = sportName || detectSportName(tournamentName);

  // Group matches by stage
  const stageStats = useMemo(() => {
    const counts: Record<TournamentStageKey, number> = {
      ALL: matches.length,
      GROUP: 0,
      ROUND_OF_64: 0,
      ROUND_OF_32: 0,
      ROUND_OF_16: 0,
      QUARTER_FINAL: 0,
      SEMI_FINAL: 0,
      FINAL: 0,
      THIRD_PLACE: 0,
    };

    matches.forEach(m => {
      const stage = getMatchStage(m);
      counts[stage] = (counts[stage] || 0) + 1;
    });

    const finalsCount = counts.FINAL + counts.THIRD_PLACE;

    const list: StageOption[] = [
      { key: 'ALL', label: 'All Stages', count: counts.ALL },
      { key: 'GROUP', label: 'Group Stages', count: counts.GROUP },
      ...(counts.ROUND_OF_64 > 0 ? [{ key: 'ROUND_OF_64' as const, label: 'Round of 64', count: counts.ROUND_OF_64 }] : []),
      ...(counts.ROUND_OF_32 > 0 ? [{ key: 'ROUND_OF_32' as const, label: 'Round of 32', count: counts.ROUND_OF_32 }] : []),
      ...(counts.ROUND_OF_16 > 0 ? [{ key: 'ROUND_OF_16' as const, label: 'Round of 16', count: counts.ROUND_OF_16 }] : []),
      { key: 'QUARTER_FINAL', label: 'Quarter-Finals', count: counts.QUARTER_FINAL },
      { key: 'SEMI_FINAL', label: 'Semi-Finals', count: counts.SEMI_FINAL },
      { key: 'FINAL', label: 'Finals', count: finalsCount },
    ];

    return list;
  }, [matches]);

  if (!isOpen) return null;

  const currentStageMatches = prepareExportableMatches(matches, selectedStage, resolvedSport);

  const getStageFileName = (stageKey: TournamentStageKey): string => {
    const base = tournamentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    switch (stageKey) {
      case 'GROUP': return `${base}_Group_Stage`;
      case 'QUARTER_FINAL': return `${base}_Quarter_Finals`;
      case 'SEMI_FINAL': return `${base}_Semi_Finals`;
      case 'FINAL': return `${base}_Final`;
      case 'THIRD_PLACE': return `${base}_3rd_Place`;
      case 'ROUND_OF_64': return `${base}_Round_of_64`;
      case 'ROUND_OF_32': return `${base}_Round_of_32`;
      case 'ROUND_OF_16': return `${base}_Round_of_16`;
      default: return `${base}_Schedule`;
    }
  };

  const handleExportSelected = () => {
    if (currentStageMatches.length === 0) {
      showWarning('No matches found for the selected stage');
      return;
    }

    const fileName = getStageFileName(selectedStage);
    if (exportFormat === 'csv') {
      exportScheduleToCSV(currentStageMatches, fileName);
    } else if (exportFormat === 'excel') {
      exportScheduleToExcel(currentStageMatches, fileName);
    } else {
      exportScheduleToPDF(currentStageMatches, fileName);
    }

    showSuccess(`Exported ${currentStageMatches.length} matches (${exportFormat.toUpperCase()})`);
    onClose();
  };

  const handleExportAllSeparate = async () => {
    setIsExporting(true);
    const stagesToExport: TournamentStageKey[] = [
      'GROUP',
      ...(stageStats.some(s => s.key === 'ROUND_OF_64' && s.count > 0) ? ['ROUND_OF_64' as const] : []),
      ...(stageStats.some(s => s.key === 'ROUND_OF_32' && s.count > 0) ? ['ROUND_OF_32' as const] : []),
      ...(stageStats.some(s => s.key === 'ROUND_OF_16' && s.count > 0) ? ['ROUND_OF_16' as const] : []),
      'QUARTER_FINAL',
      'SEMI_FINAL',
      'FINAL',
    ];

    let exportedCount = 0;
    try {
      for (const stg of stagesToExport) {
        const stageList = prepareExportableMatches(matches, stg, resolvedSport);
        if (stageList.length > 0) {
          const fileName = getStageFileName(stg);
          if (exportFormat === 'csv') {
            exportScheduleToCSV(stageList, fileName);
          } else if (exportFormat === 'excel') {
            exportScheduleToExcel(stageList, fileName);
          } else {
            exportScheduleToPDF(stageList, fileName);
          }
          exportedCount++;
          // Small delay to allow sequential browser downloads without getting blocked
          await new Promise(r => setTimeout(r, 250));
        }
      }
      showSuccess(`Successfully exported ${exportedCount} stage files separately (${exportFormat.toUpperCase()})`);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Export Match Schedule</h3>
              <p className="text-[11px] text-indigo-200 truncate max-w-sm">{tournamentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 1. Stage Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Select Stage to Export:
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {currentStageMatches.length} match{currentStageMatches.length !== 1 ? 'es' : ''}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stageStats.map(s => {
                const isSelected = selectedStage === s.key;
                const isDisabled = s.count === 0 && s.key !== 'ALL';
                return (
                  <button
                    key={s.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedStage(s.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isDisabled
                        ? 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600/30 cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer'
                    }`}
                  >
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className={`text-[10px] mt-1 font-mono ${isDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                      {s.count} match{s.count !== 1 ? 'es' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Format Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Export Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  exportFormat === 'csv'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs">CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  exportFormat === 'excel'
                    ? 'border-green-600 bg-green-50 text-green-950 font-semibold ring-1 ring-green-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-700" />
                <span className="text-xs">Excel (.xls)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  exportFormat === 'pdf'
                    ? 'border-red-500 bg-red-50 text-red-950 font-semibold ring-1 ring-red-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs">PDF / Print</span>
              </button>
            </div>
          </div>

          {/* 3. Included Data Fields Preview Banner */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Included in Official Export:
            </span>
            <div className="grid grid-cols-2 gap-1 pl-4 text-[10px] text-slate-500">
              <span>• Match # & Stage Name</span>
              <span>• Team 1 & Flat Details</span>
              <span>• Scheduled Date & Time (12h)</span>
              <span>• Team 2 & Flat Details</span>
              <span>• Venue & Court Name</span>
              <span>• Status & Score Results</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportAllSeparate}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download Group Stage, Quarters, Semis, and Finals as separate files"
          >
            <Files className="w-3.5 h-3.5 text-indigo-600" />
            Export All Stages (Separate Files)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExporting || currentStageMatches.length === 0}
              onClick={handleExportSelected}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export {selectedStage === 'ALL' ? 'All' : stageStats.find(s => s.key === selectedStage)?.label || 'Stage'} ({exportFormat.toUpperCase()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
